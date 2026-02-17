use std::collections::HashMap;
use std::ffi::c_void;
use std::fs;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, WebviewUrl, WebviewWindowBuilder};
use tauri::Manager;

// ── Hide macOS traffic lights ─────────────────────────────────
#[cfg(target_os = "macos")]
fn hide_traffic_lights(window: &tauri::WebviewWindow) {
    #[link(name = "objc", kind = "dylib")]
    extern "C" {
        fn objc_msgSend(receiver: *const c_void, sel: *const c_void, ...) -> *const c_void;
        fn sel_registerName(name: *const u8) -> *const c_void;
    }

    unsafe {
        let ns_window = window.ns_window().unwrap() as *const c_void;
        let sel_button = sel_registerName(b"standardWindowButton:\0".as_ptr());
        let sel_set_hidden = sel_registerName(b"setHidden:\0".as_ptr());

        // NSWindowButton: 0=close, 1=miniaturize, 2=zoom
        for button_type in 0u64..3 {
            let button: *const c_void = objc_msgSend(ns_window, sel_button, button_type);
            if !button.is_null() {
                objc_msgSend(button, sel_set_hidden, 1 as std::ffi::c_int);
            }
        }
    }
}

/// Map a window label ("main", "monitor-1", etc.) to its display index.
fn window_label_to_display_index(label: &str) -> usize {
    if label == "main" {
        0
    } else if let Some(suffix) = label.strip_prefix("monitor-") {
        suffix.parse().unwrap_or(0)
    } else {
        0
    }
}

// ── Color palette (subtle / muted pastels) ───────────────────
const COLORS: &[&str] = &[
    "#F5E6A3", // muted yellow
    "#F2B8A0", // muted coral
    "#A8CCE0", // muted blue
    "#A8D8B0", // muted green
    "#C8A8D8", // muted purple
    "#F0C8A0", // muted orange
    "#A0D8D0", // muted teal
    "#E0B8C8", // muted pink
];

// ── Private CoreGraphics API (space detection) ──────────────────
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGSMainConnectionID() -> i32;
    fn CGSCopyManagedDisplaySpaces(cid: i32) -> *const c_void;
    fn CGGetActiveDisplayList(max: u32, displays: *mut u32, count: *mut u32) -> i32;
    fn CGDisplayRegisterReconfigurationCallback(
        callback: extern "C" fn(u32, u32, *mut c_void),
        user_info: *mut c_void,
    ) -> i32;
}

// ── Monitor enumeration with CG fallback ─────────────────────────
/// Returns the list of monitors, retrying once if `available_monitors()`
/// reports fewer displays than CoreGraphics `CGGetActiveDisplayList`.
fn get_monitors_with_fallback(app: &tauri::App) -> Result<Vec<tauri::Monitor>, Box<dyn std::error::Error>> {
    let cg_count = get_cg_display_count();
    log::info!("[monitors] CGGetActiveDisplayList reports {} display(s)", cg_count);

    let monitors = app.available_monitors()?;
    log::info!("[monitors] available_monitors() returned {} monitor(s)", monitors.len());

    if monitors.len() >= cg_count as usize || cg_count == 0 {
        return Ok(monitors);
    }

    // Mismatch — CG sees more displays. Retry after a short delay.
    log::warn!(
        "[monitors] mismatch: CG={} vs Tauri={}. Retrying after 500ms...",
        cg_count, monitors.len()
    );
    std::thread::sleep(std::time::Duration::from_millis(500));

    let retry = app.available_monitors()?;
    log::info!("[monitors] retry: available_monitors() returned {} monitor(s)", retry.len());

    if retry.len() >= monitors.len() {
        Ok(retry)
    } else {
        Ok(monitors)
    }
}

/// Ask CoreGraphics how many active displays exist.
fn get_cg_display_count() -> u32 {
    let mut count: u32 = 0;
    let err = unsafe { CGGetActiveDisplayList(0, std::ptr::null_mut(), &mut count) };
    if err != 0 {
        log::warn!("[monitors] CGGetActiveDisplayList failed with error {}", err);
        return 0;
    }
    count
}

// ── CoreFoundation helpers ─────────────────────────────────────
extern "C" {
    fn CFArrayGetCount(arr: *const c_void) -> isize;
    fn CFArrayGetValueAtIndex(arr: *const c_void, idx: isize) -> *const c_void;
    fn CFDictionaryGetValue(dict: *const c_void, key: *const c_void) -> *const c_void;
    fn CFStringCreateWithBytes(
        alloc: *const c_void,
        bytes: *const u8,
        len: isize,
        encoding: u32,
        is_external: bool,
    ) -> *const c_void;
    fn CFNumberGetValue(num: *const c_void, the_type: isize, out: *mut c_void) -> bool;
    fn CFRelease(cf: *const c_void);
}

const CF_STRING_ENCODING_UTF8: u32 = 0x0800_0100;
const CF_NUMBER_SINT64: isize = 4;
const CF_NUMBER_SINT32: isize = 3;

unsafe fn cf_str(s: &str) -> *const c_void {
    CFStringCreateWithBytes(
        std::ptr::null(),
        s.as_ptr(),
        s.len() as isize,
        CF_STRING_ENCODING_UTF8,
        false,
    )
}

// ── Accessibility API (check / request permission) ────────────
#[link(name = "ApplicationServices", kind = "framework")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
    fn AXIsProcessTrustedWithOptions(options: *const c_void) -> bool;
}

extern "C" {
    fn CFDictionaryCreate(
        allocator: *const c_void,
        keys: *const *const c_void,
        values: *const *const c_void,
        num_values: isize,
        key_callbacks: *const c_void,
        value_callbacks: *const c_void,
    ) -> *const c_void;
    static kCFBooleanTrue: *const c_void;
    static kCFTypeDictionaryKeyCallBacks: u8;
    static kCFTypeDictionaryValueCallBacks: u8;
}

// ── Space detection ────────────────────────────────────────────
/// Returns (id64, space_type) for the active space on the given display.
/// space_type 0 = normal desktop, non-zero (typically 4) = full-screen app.
fn space_info_for_display(target_display: usize) -> (i64, i32) {
    unsafe {
        let conn = CGSMainConnectionID();
        if conn == 0 {
            return (0, 0);
        }

        let displays = CGSCopyManagedDisplaySpaces(conn);
        if displays.is_null() {
            return (0, 0);
        }
        let display_count = CFArrayGetCount(displays) as usize;
        if display_count == 0 {
            CFRelease(displays);
            return (0, 0);
        }

        let key_current = cf_str("Current Space");
        let key_id = cf_str("id64");
        let key_type = cf_str("type");

        let clamped = if target_display < display_count { target_display } else { 0 };
        let disp = CFArrayGetValueAtIndex(displays, clamped as isize);
        let current_space = CFDictionaryGetValue(disp, key_current);
        let mut active_id: i64 = 0;
        let mut space_type: i32 = 0;
        if !current_space.is_null() {
            let id_ptr = CFDictionaryGetValue(current_space, key_id);
            if !id_ptr.is_null() {
                CFNumberGetValue(id_ptr, CF_NUMBER_SINT64, &mut active_id as *mut _ as *mut c_void);
            }
            let type_ptr = CFDictionaryGetValue(current_space, key_type);
            if !type_ptr.is_null() {
                CFNumberGetValue(type_ptr, CF_NUMBER_SINT32, &mut space_type as *mut _ as *mut c_void);
            }
        }

        CFRelease(key_current);
        CFRelease(key_id);
        CFRelease(key_type);
        CFRelease(displays);
        (active_id, space_type)
    }
}

// ── Space enumeration (space_id, display, local_1based) ───

fn enumerate_spaces() -> Vec<(i64, usize, u32)> {
    let mut result = Vec::new();
    unsafe {
        let conn = CGSMainConnectionID();
        if conn == 0 { return result; }

        let displays = CGSCopyManagedDisplaySpaces(conn);
        if displays.is_null() { return result; }

        let display_count = CFArrayGetCount(displays) as usize;
        let key_spaces = cf_str("Spaces");
        let key_type = cf_str("type");
        let key_id = cf_str("id64");

        for d in 0..display_count {
            let display = CFArrayGetValueAtIndex(displays, d as isize);
            let spaces = CFDictionaryGetValue(display, key_spaces);
            if spaces.is_null() { continue; }

            let count = CFArrayGetCount(spaces);
            let mut local: u32 = 1; // 1-based for Ctrl+N shortcuts
            for i in 0..count {
                let space = CFArrayGetValueAtIndex(spaces, i);
                let type_ptr = CFDictionaryGetValue(space, key_type);
                let mut stype: i32 = -1;
                if !type_ptr.is_null() {
                    CFNumberGetValue(type_ptr, CF_NUMBER_SINT32, &mut stype as *mut _ as *mut c_void);
                }
                if stype != 0 { continue; }

                let id_ptr = CFDictionaryGetValue(space, key_id);
                let mut sid: i64 = 0;
                if !id_ptr.is_null() {
                    CFNumberGetValue(id_ptr, CF_NUMBER_SINT64, &mut sid as *mut _ as *mut c_void);
                }

                result.push((sid, d, local));
                local += 1;
            }
        }

        CFRelease(key_spaces);
        CFRelease(key_type);
        CFRelease(key_id);
        CFRelease(displays);
    }
    result
}

// ── Keyboard simulation (Ctrl+Arrow to switch space) ──────────

fn simulate_desktop_switch(steps: i32) {
    // key code 123 = left arrow, 124 = right arrow
    let keycode = if steps > 0 { 124 } else { 123 };
    for _ in 0..steps.unsigned_abs() {
        let script = format!(
            "tell application \"System Events\" to key code {} using control down",
            keycode
        );
        std::process::Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .ok();
        std::thread::sleep(std::time::Duration::from_millis(300));
    }
}

// ── Todo persistence ──────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
struct TodoItem {
    id: String,
    text: String,
    done: bool,
}

type NotesStore = HashMap<i64, Vec<TodoItem>>;
type TitleStore = HashMap<i64, String>;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct SavedContext {
    title: String,
    todos: Vec<TodoItem>,
    saved_at: String, // ISO 8601
}

type ContextHistoryStore = HashMap<i64, Vec<SavedContext>>;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct CompletedItem {
    id: String,
    text: String,
    desktop_id: i64,
    completed_at: String,
}

fn default_desktop_count() -> u32 { 10 }
fn default_timer_presets() -> Vec<u32> { vec![60, 300, 600] }
fn default_notify_system() -> bool { true }
fn default_notify_flash() -> bool { true }
#[derive(Serialize, Deserialize, Clone, Debug)]
struct Settings {
    custom_colors: HashMap<i64, String>,
    setup_complete: bool,
    #[serde(default = "default_desktop_count")]
    desktop_count: u32,
    #[serde(default = "default_timer_presets")]
    timer_presets: Vec<u32>,
    #[serde(default = "default_notify_system")]
    notify_system: bool,
    #[serde(default = "default_notify_flash")]
    notify_flash: bool,
    #[serde(default)]
    hidden_panels: Vec<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            custom_colors: HashMap::new(),
            setup_complete: false,
            desktop_count: 10,
            timer_presets: default_timer_presets(),
            notify_system: true,
            notify_flash: true,
            hidden_panels: Vec::new(),
        }
    }
}

fn default_version() -> u32 { 0 }

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
struct PersistData {
    notes: NotesStore,
    titles: TitleStore,
    #[serde(default)]
    settings: Settings,
    #[serde(default = "default_version")]
    version: u32,
    #[serde(default)]
    context_history: ContextHistoryStore,
    #[serde(default)]
    completed: Vec<CompletedItem>,
}

struct AppState {
    data: Mutex<PersistData>,
    data_path: Mutex<String>,
}

fn load_data(path: &str) -> PersistData {
    fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn persist_data(path: &str, data: &PersistData) {
    if let Ok(json) = serde_json::to_string_pretty(data) {
        let _ = fs::write(path, json);
    }
}

/// Migrate v0 data (keyed by positional index) to v1 (keyed by space id64).
fn migrate_v0_to_v1(data: &mut PersistData) {
    if data.version >= 1 {
        return;
    }

    let spaces = enumerate_spaces();
    // Build position → space_id mapping (position is the global 0-based index)
    let pos_to_sid: HashMap<i64, i64> = spaces
        .iter()
        .enumerate()
        .map(|(pos, &(sid, _disp, _local))| (pos as i64, sid))
        .collect();

    fn rekey<V: Clone>(old: &HashMap<i64, V>, mapping: &HashMap<i64, i64>) -> HashMap<i64, V> {
        let mut new = HashMap::new();
        for (old_key, value) in old {
            if let Some(&new_key) = mapping.get(old_key) {
                new.insert(new_key, value.clone());
            }
            // Drop entries that don't map to a current space
        }
        new
    }

    data.notes = rekey(&data.notes, &pos_to_sid);
    data.titles = rekey(&data.titles, &pos_to_sid);
    data.settings.custom_colors = rekey(&data.settings.custom_colors, &pos_to_sid);
    data.version = 1;
}

// ── Tauri commands ────────────────────────────────────────────

#[derive(Serialize, Clone)]
struct DesktopInfo {
    space_id: i64,
    position: u32,
    name: String,
    color: String,
    is_fullscreen: bool,
}

fn default_color(position: u32) -> String {
    COLORS[(position as usize) % COLORS.len()].to_string()
}

#[tauri::command]
fn get_desktop(state: tauri::State<'_, AppState>, display: u32) -> DesktopInfo {
    let (sid, space_type) = space_info_for_display(display as usize);
    let spaces = enumerate_spaces();
    let position = spaces.iter()
        .position(|&(s, _, _)| s == sid)
        .unwrap_or(0) as u32;
    let data = state.data.lock().unwrap();
    let color = data.settings.custom_colors.get(&sid)
        .cloned()
        .unwrap_or_else(|| default_color(position));
    DesktopInfo {
        space_id: sid,
        position,
        name: format!("Desktop {}", position + 1),
        color,
        is_fullscreen: space_type != 0,
    }
}

#[tauri::command]
fn get_todos(state: tauri::State<'_, AppState>, desktop: i64) -> Vec<TodoItem> {
    let data = state.data.lock().unwrap();
    data.notes.get(&desktop).cloned().unwrap_or_default()
}

#[tauri::command]
fn save_todos(state: tauri::State<'_, AppState>, desktop: i64, todos: Vec<TodoItem>) {
    let mut data = state.data.lock().unwrap();
    data.notes.insert(desktop, todos);
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn get_title(state: tauri::State<'_, AppState>, desktop: i64) -> String {
    let data = state.data.lock().unwrap();
    data.titles.get(&desktop).cloned().unwrap_or_default()
}

#[tauri::command]
fn save_title(state: tauri::State<'_, AppState>, desktop: i64, title: String) {
    let mut data = state.data.lock().unwrap();
    if title.is_empty() {
        data.titles.remove(&desktop);
    } else {
        data.titles.insert(desktop, title);
    }
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[derive(Serialize, Clone)]
struct DesktopSummary {
    space_id: i64,
    position: u32,
    name: String,
    title: String,
    color: String,
    todo_count: usize,
}

#[tauri::command]
fn list_all_desktops(state: tauri::State<'_, AppState>) -> Vec<DesktopSummary> {
    let spaces = enumerate_spaces();
    let data = state.data.lock().unwrap();
    spaces
        .iter()
        .enumerate()
        .map(|(pos, &(sid, _disp, _local))| {
            let position = pos as u32;
            let todos = data.notes.get(&sid);
            let active_count = todos
                .map(|t| t.iter().filter(|i| !i.done).count())
                .unwrap_or(0);
            let color = data.settings.custom_colors.get(&sid)
                .cloned()
                .unwrap_or_else(|| default_color(position));
            DesktopSummary {
                space_id: sid,
                position,
                name: format!("Desktop {}", position + 1),
                title: data.titles.get(&sid).cloned().unwrap_or_default(),
                color,
                todo_count: active_count,
            }
        })
        .collect()
}

#[derive(Serialize, Clone)]
struct DisplayGroup {
    display_index: usize,
    desktops: Vec<DesktopSummary>,
}

#[tauri::command]
fn list_desktops_grouped(state: tauri::State<'_, AppState>) -> Vec<DisplayGroup> {
    let spaces = enumerate_spaces();
    let data = state.data.lock().unwrap();

    let mut groups: std::collections::BTreeMap<usize, Vec<DesktopSummary>> = std::collections::BTreeMap::new();
    let mut global_pos: u32 = 0;

    for &(sid, disp, _local) in &spaces {
        let position = global_pos;
        let todos = data.notes.get(&sid);
        let active_count = todos
            .map(|t| t.iter().filter(|i| !i.done).count())
            .unwrap_or(0);
        let color = data.settings.custom_colors.get(&sid)
            .cloned()
            .unwrap_or_else(|| default_color(position));
        let summary = DesktopSummary {
            space_id: sid,
            position,
            name: format!("Desktop {}", position + 1),
            title: data.titles.get(&sid).cloned().unwrap_or_default(),
            color,
            todo_count: active_count,
        };
        groups.entry(disp).or_default().push(summary);
        global_pos += 1;
    }

    groups.into_iter().map(|(display_index, desktops)| {
        DisplayGroup { display_index, desktops }
    }).collect()
}

#[tauri::command]
fn switch_desktop(display: u32, target: i64) -> bool {
    let (current_sid, _) = space_info_for_display(display as usize);
    let spaces = enumerate_spaces();

    // Find positions of current and target on the same display
    let display_spaces: Vec<i64> = spaces.iter()
        .filter(|&&(_, disp, _)| disp == display as usize)
        .map(|&(sid, _, _)| sid)
        .collect();

    let current_pos = display_spaces.iter().position(|&s| s == current_sid);
    let target_pos = display_spaces.iter().position(|&s| s == target);

    match (current_pos, target_pos) {
        (Some(cur), Some(tgt)) if cur != tgt => {
            let steps = tgt as i32 - cur as i32;
            simulate_desktop_switch(steps);
            true
        }
        _ => false,
    }
}

// ── Session commands ───────────────────────────────────────────

const MAX_HISTORY_PER_DESKTOP: usize = 20;

#[tauri::command]
fn start_new_session(state: tauri::State<'_, AppState>) {
    let mut data = state.data.lock().unwrap();
    let now = chrono::Utc::now().to_rfc3339();

    // For each desktop with data, push current context into history
    let space_ids: Vec<i64> = data.notes.keys().chain(data.titles.keys()).copied().collect::<std::collections::HashSet<i64>>().into_iter().collect();

    for sid in space_ids {
        let title = data.titles.get(&sid).cloned().unwrap_or_default();
        let todos = data.notes.get(&sid).cloned().unwrap_or_default();
        if title.is_empty() && todos.is_empty() {
            continue;
        }
        let entry = SavedContext {
            title,
            todos,
            saved_at: now.clone(),
        };
        let history = data.context_history.entry(sid).or_default();
        history.push(entry);
        // Cap at MAX_HISTORY_PER_DESKTOP (drop oldest)
        if history.len() > MAX_HISTORY_PER_DESKTOP {
            let excess = history.len() - MAX_HISTORY_PER_DESKTOP;
            history.drain(..excess);
        }
    }

    // Clear current session
    data.notes.clear();
    data.titles.clear();

    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn get_context_history(state: tauri::State<'_, AppState>) -> ContextHistoryStore {
    let data = state.data.lock().unwrap();
    data.context_history.clone()
}

#[tauri::command]
fn restore_context(state: tauri::State<'_, AppState>, desktop: i64, index: usize) -> bool {
    let mut data = state.data.lock().unwrap();
    let saved = match data.context_history.get(&desktop).and_then(|h| h.get(index)) {
        Some(ctx) => ctx.clone(),
        None => return false,
    };
    data.notes.insert(desktop, saved.todos);
    if saved.title.is_empty() {
        data.titles.remove(&desktop);
    } else {
        data.titles.insert(desktop, saved.title);
    }
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
    true
}

// ── Settings commands ──────────────────────────────────────────

#[tauri::command]
fn get_settings(state: tauri::State<'_, AppState>) -> Settings {
    let data = state.data.lock().unwrap();
    data.settings.clone()
}

#[tauri::command]
fn complete_setup(state: tauri::State<'_, AppState>) {
    let mut data = state.data.lock().unwrap();
    data.settings.setup_complete = true;
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn save_color(state: tauri::State<'_, AppState>, desktop: i64, color: String) {
    let mut data = state.data.lock().unwrap();
    data.settings.custom_colors.insert(desktop, color);
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[derive(Serialize, Clone)]
struct SpaceInfo {
    space_id: i64,
    position: u32,
    name: String,
    title: String,
    color: String,
}

#[tauri::command]
fn list_all_spaces(state: tauri::State<'_, AppState>) -> Vec<SpaceInfo> {
    let spaces = enumerate_spaces();
    let data = state.data.lock().unwrap();
    spaces
        .iter()
        .enumerate()
        .map(|(pos, &(sid, _disp, _local))| {
            let position = pos as u32;
            let color = data.settings.custom_colors.get(&sid)
                .cloned()
                .unwrap_or_else(|| default_color(position));
            SpaceInfo {
                space_id: sid,
                position,
                name: format!("Desktop {}", position + 1),
                title: data.titles.get(&sid).cloned().unwrap_or_default(),
                color,
            }
        })
        .collect()
}

#[tauri::command]
fn save_desktop_count(state: tauri::State<'_, AppState>, count: u32) {
    let mut data = state.data.lock().unwrap();
    data.settings.desktop_count = count;
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn apply_theme(state: tauri::State<'_, AppState>, colors: Vec<String>) {
    let spaces = enumerate_spaces();
    let mut data = state.data.lock().unwrap();
    data.settings.custom_colors.clear();
    for (i, &(sid, _disp, _local)) in spaces.iter().enumerate() {
        if i < colors.len() {
            data.settings.custom_colors.insert(sid, colors[i].clone());
        }
    }
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn save_timer_presets(state: tauri::State<'_, AppState>, presets: Vec<u32>) {
    let mut data = state.data.lock().unwrap();
    data.settings.timer_presets = presets;
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn save_notify_settings(state: tauri::State<'_, AppState>, system: bool, flash: bool) {
    let mut data = state.data.lock().unwrap();
    data.settings.notify_system = system;
    data.settings.notify_flash = flash;
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn save_hidden_panels(state: tauri::State<'_, AppState>, panels: Vec<String>) {
    let mut data = state.data.lock().unwrap();
    data.settings.hidden_panels = panels;
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn clear_all_data(state: tauri::State<'_, AppState>) {
    let mut data = state.data.lock().unwrap();
    data.notes.clear();
    data.titles.clear();
    data.settings.custom_colors.clear();
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

// ── Accessibility commands ─────────────────────────────────────

#[tauri::command]
fn check_accessibility() -> bool {
    unsafe { AXIsProcessTrusted() }
}

#[tauri::command]
fn request_accessibility() -> bool {
    unsafe {
        let key = cf_str("AXTrustedCheckOptionPrompt");
        let keys = [key];
        let values = [kCFBooleanTrue];
        let opts = CFDictionaryCreate(
            std::ptr::null(),
            keys.as_ptr(),
            values.as_ptr(),
            1,
            &kCFTypeDictionaryKeyCallBacks as *const _ as *const c_void,
            &kCFTypeDictionaryValueCallBacks as *const _ as *const c_void,
        );
        let trusted = AXIsProcessTrustedWithOptions(opts);
        CFRelease(opts);
        CFRelease(key);
        trusted
    }
}

// ── Completed-item commands ────────────────────────────────────

#[tauri::command]
fn get_completed(state: tauri::State<'_, AppState>) -> Vec<CompletedItem> {
    let data = state.data.lock().unwrap();
    data.completed.clone()
}

#[tauri::command]
fn add_completed(state: tauri::State<'_, AppState>, text: String, desktop_id: i64) {
    let mut data = state.data.lock().unwrap();
    let item = CompletedItem {
        id: uuid::Uuid::new_v4().to_string(),
        text,
        desktop_id,
        completed_at: chrono::Utc::now().to_rfc3339(),
    };
    data.completed.push(item);
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

#[tauri::command]
fn clear_completed(state: tauri::State<'_, AppState>) {
    let mut data = state.data.lock().unwrap();
    data.completed.clear();
    let path = state.data_path.lock().unwrap();
    persist_data(&path, &data);
}

// ── CFRunLoop (for background observer thread) ────────────────
extern "C" {
    fn CFRunLoopRun();
}

// ── NSWorkspace space-change observer ─────────────────────────

/// Returns one DesktopInfo per display (indexed by display number),
/// matching the same logic as the `get_desktop` command.
fn build_desktop_infos(state: &AppState) -> Vec<DesktopInfo> {
    let spaces = enumerate_spaces();
    let display_count = spaces.iter().map(|&(_, d, _)| d).max().map_or(1, |m| m + 1);
    let data = state.data.lock().unwrap();

    (0..display_count)
        .map(|disp| {
            let (sid, space_type) = space_info_for_display(disp);
            let position = spaces
                .iter()
                .position(|&(s, _, _)| s == sid)
                .unwrap_or(0) as u32;
            let color = data
                .settings
                .custom_colors
                .get(&sid)
                .cloned()
                .unwrap_or_else(|| default_color(position));
            DesktopInfo {
                space_id: sid,
                position,
                name: format!("Desktop {}", position + 1),
                color,
                is_fullscreen: space_type != 0,
            }
        })
        .collect()
}

fn start_space_observer(app_handle: tauri::AppHandle) {
    std::thread::spawn(move || {
        unsafe {
            use objc2_app_kit::NSWorkspace;
            use block2::RcBlock;

            let workspace = NSWorkspace::sharedWorkspace();
            let nc = workspace.notificationCenter();

            let name = objc2_foundation::NSString::from_str("NSWorkspaceActiveSpaceDidChangeNotification");

            let handle = app_handle.clone();
            let block = RcBlock::new(move |_notification: std::ptr::NonNull<objc2_foundation::NSNotification>| {
                let state = handle.state::<AppState>();
                let infos = build_desktop_infos(&state);
                if let Err(e) = handle.emit("desktop-changed", &infos) {
                    log::error!("Failed to emit desktop-changed: {}", e);
                }
            });

            let _observer = nc.addObserverForName_object_queue_usingBlock(
                Some(&name),
                None,
                None,
                &block,
            );

            // Keep observer alive and run the run loop to receive notifications
            // _observer is retained by the notification center as long as we don't remove it
            CFRunLoopRun();
        }
    });
}

// ── Monitor connect/disconnect observer ───────────────────────

// Flags from CGDisplayChangeSummaryFlags
const K_CG_DISPLAY_BEGIN_CONFIGURATION_FLAG: u32 = 1 << 0;

/// Store the app handle globally so the CG callback can access it.
static MONITOR_APP_HANDLE: Mutex<Option<tauri::AppHandle>> = Mutex::new(None);

extern "C" fn display_reconfiguration_callback(_display: u32, flags: u32, _user_info: *mut c_void) {
    // Ignore the "begin" notification — only act on the completion notification
    if flags & K_CG_DISPLAY_BEGIN_CONFIGURATION_FLAG != 0 {
        return;
    }

    log::info!("[monitors] display reconfiguration detected (flags=0x{:x})", flags);

    let handle = {
        let guard = MONITOR_APP_HANDLE.lock().unwrap();
        match guard.as_ref() {
            Some(h) => h.clone(),
            None => return,
        }
    };

    // Delay briefly to let macOS settle its display list
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(500));
        sync_windows_to_monitors(&handle);
    });
}

fn sync_windows_to_monitors(handle: &tauri::AppHandle) {
    let monitors = match handle.available_monitors() {
        Ok(m) => m,
        Err(e) => {
            log::error!("[monitors] failed to enumerate monitors: {}", e);
            return;
        }
    };

    let existing = handle.webview_windows();
    let monitor_count = monitors.len();
    let win_w = 290.0_f64;
    let win_h = 220.0_f64;

    log::info!(
        "[monitors] sync: {} monitor(s), {} existing window(s) ({:?})",
        monitor_count,
        existing.len(),
        existing.keys().collect::<Vec<_>>()
    );

    // Build expected labels for each monitor index
    let expected_labels: Vec<String> = (0..monitor_count)
        .map(|i| if i == 0 { "main".to_string() } else { format!("monitor-{}", i) })
        .collect();

    // Create windows for new monitors
    for (i, monitor) in monitors.iter().enumerate() {
        let label = &expected_labels[i];
        if existing.contains_key(label.as_str()) {
            continue;
        }

        let m_pos = monitor.position();
        let m_size = monitor.size();
        let scale = monitor.scale_factor();

        let logical_x = m_pos.x as f64 / scale;
        let logical_y = m_pos.y as f64 / scale;
        let logical_w = m_size.width as f64 / scale;

        let x = logical_x + logical_w - win_w - 16.0;
        let y = logical_y + 32.0;

        log::info!("[monitors] creating window '{}' for new monitor {}", label, i);

        match WebviewWindowBuilder::new(
            handle,
            label.as_str(),
            WebviewUrl::App("index.html".into()),
        )
        .title("Context Maintainer")
        .inner_size(win_w, win_h)
        .min_inner_size(180.0, 100.0)
        .always_on_top(true)
        .resizable(true)
        .maximizable(false)
        .visible_on_all_workspaces(true)
        .title_bar_style(tauri::TitleBarStyle::Overlay)
        .hidden_title(true)
        .traffic_light_position(tauri::Position::Logical(
            tauri::LogicalPosition::new(-20.0, -20.0),
        ))
        .build() {
            Ok(window) => {
                window.set_position(tauri::Position::Logical(
                    tauri::LogicalPosition::new(x, y),
                )).ok();

                #[cfg(target_os = "macos")]
                {
                    std::thread::sleep(std::time::Duration::from_millis(200));
                    hide_traffic_lights(&window);
                }

                log::info!("[monitors] created window '{}' at ({:.0},{:.0})", label, x, y);
            }
            Err(e) => {
                log::error!("[monitors] failed to create window '{}': {}", label, e);
            }
        }
    }

    // Close windows for removed monitors
    for (label, window) in &existing {
        if label.as_str() == "main" {
            // Never close the main window — if its monitor was removed,
            // it will be repositioned to the primary display below
            continue;
        }
        if !expected_labels.contains(&label.to_string()) {
            log::info!("[monitors] closing window '{}' (monitor removed)", label);
            window.close().ok();
        }
    }

    // If the main window's monitor (index 0) changed, reposition it
    if let Some(main_window) = handle.get_webview_window("main") {
        if let Some(monitor) = monitors.first() {
            let m_pos = monitor.position();
            let m_size = monitor.size();
            let scale = monitor.scale_factor();
            let logical_x = m_pos.x as f64 / scale;
            let logical_y = m_pos.y as f64 / scale;
            let logical_w = m_size.width as f64 / scale;
            let x = logical_x + logical_w - win_w - 16.0;
            let y = logical_y + 32.0;
            main_window.set_position(tauri::Position::Logical(
                tauri::LogicalPosition::new(x, y),
            )).ok();
        }
    }

    // Notify frontend to refresh monitor references
    if let Err(e) = handle.emit("monitors-changed", monitor_count) {
        log::error!("[monitors] failed to emit monitors-changed: {}", e);
    }
}

fn start_monitor_observer(app_handle: tauri::AppHandle) {
    {
        let mut guard = MONITOR_APP_HANDLE.lock().unwrap();
        *guard = Some(app_handle);
    }

    unsafe {
        let result = CGDisplayRegisterReconfigurationCallback(
            display_reconfiguration_callback,
            std::ptr::null_mut(),
        );
        if result != 0 {
            log::error!("[monitors] CGDisplayRegisterReconfigurationCallback failed: {}", result);
        } else {
            log::info!("[monitors] registered display reconfiguration callback");
        }
    }
}

// ── Entry point ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // Persistence setup — use a separate file in debug builds
            // so dev and prod don't clobber each other's data.
            let data_dir = app.path().app_data_dir().expect("no app data dir");
            fs::create_dir_all(&data_dir).ok();
            let data_file = if cfg!(debug_assertions) { "notes-dev.json" } else { "notes.json" };
            let data_path = data_dir.join(data_file);
            let data_path_str = data_path.to_string_lossy().to_string();
            log::info!("App starting, data path: {}", data_path_str);
            let mut data = load_data(&data_path_str);

            // Migrate v0 → v1 (positional index → space id64)
            if data.version < 1 {
                log::info!("Migrating data from v0 to v1");
                migrate_v0_to_v1(&mut data);
                persist_data(&data_path_str, &data);
            }

            app.manage(AppState {
                data: Mutex::new(data),
                data_path: Mutex::new(data_path_str),
            });

            // Hide from Dock — pure menu-bar app
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // System tray icon with context menu
            let icon = Image::from_path("icons/32x32.png")
                .or_else(|_| Image::from_path("src-tauri/icons/32x32.png"))
                .unwrap_or_else(|_| Image::from_bytes(include_bytes!("../icons/32x32.png")).expect("embedded icon"));

            let toggle_all = MenuItem::with_id(app, "toggle_all", "Hide Entirely", true, None::<&str>)?;
            let toggle_desktop = MenuItem::with_id(app, "toggle_desktop", "Hide This Desktop", true, None::<&str>)?;
            let toggle_monitor = MenuItem::with_id(app, "toggle_monitor", "Hide This Monitor", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[
                &toggle_all,
                &toggle_desktop,
                &toggle_monitor,
                &PredefinedMenuItem::separator(app)?,
                &quit,
            ])?;

            TrayIconBuilder::new()
                .icon(icon)
                .tooltip("Context Maintainer")
                .menu(&menu)
                .on_menu_event(move |app, event| {
                    match event.id.as_ref() {
                        "toggle_all" => {
                            let windows = app.webview_windows();
                            let any_visible = windows.values().any(|w| w.is_visible().unwrap_or(false));
                            if any_visible {
                                for window in windows.values() {
                                    window.hide().ok();
                                }
                                toggle_all.set_text("Show Entirely").ok();
                            } else {
                                for window in windows.values() {
                                    window.show().ok();
                                    window.set_focus().ok();
                                }
                                toggle_all.set_text("Hide Entirely").ok();
                            }
                        }
                        "toggle_desktop" => {
                            let spaces = enumerate_spaces();
                            let display_count = spaces.iter().map(|&(_, d, _)| d).max().map_or(1, |m| m + 1);

                            let mut active_space_per_display: HashMap<usize, i64> = HashMap::new();
                            for disp in 0..display_count {
                                let (sid, _) = space_info_for_display(disp);
                                active_space_per_display.insert(disp, sid);
                            }

                            let current_space = active_space_per_display.get(&0).copied().unwrap_or(0);

                            let windows = app.webview_windows();
                            let desktop_windows: Vec<_> = windows.iter().filter(|(label, _)| {
                                let disp_idx = window_label_to_display_index(label);
                                active_space_per_display.get(&disp_idx).copied().unwrap_or(0) == current_space
                            }).collect();

                            let any_visible = desktop_windows.iter().any(|(_, w)| w.is_visible().unwrap_or(false));
                            if any_visible {
                                for (_, window) in &desktop_windows {
                                    window.hide().ok();
                                }
                                toggle_desktop.set_text("Show This Desktop").ok();
                            } else {
                                for (_, window) in &desktop_windows {
                                    window.show().ok();
                                    window.set_focus().ok();
                                }
                                toggle_desktop.set_text("Hide This Desktop").ok();
                            }
                        }
                        "toggle_monitor" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let visible = window.is_visible().unwrap_or(false);
                                if visible {
                                    window.hide().ok();
                                    toggle_monitor.set_text("Show This Monitor").ok();
                                } else {
                                    window.show().ok();
                                    window.set_focus().ok();
                                    toggle_monitor.set_text("Hide This Monitor").ok();
                                }
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Create one window per monitor, with CGGetActiveDisplayList fallback
            let monitors = get_monitors_with_fallback(app)?;
            let win_w = 290.0_f64;
            let win_h = 220.0_f64;

            for (i, monitor) in monitors.iter().enumerate() {
                let label = if i == 0 { "main".to_string() } else { format!("monitor-{}", i) };

                let m_pos = monitor.position();
                let m_size = monitor.size();
                let scale = monitor.scale_factor();

                log::info!(
                    "[startup] monitor {}: name={:?} pos=({},{}) size={}x{} scale={}",
                    i, monitor.name(), m_pos.x, m_pos.y,
                    m_size.width, m_size.height, scale
                );

                let logical_x = m_pos.x as f64 / scale;
                let logical_y = m_pos.y as f64 / scale;
                let logical_w = m_size.width as f64 / scale;

                let x = logical_x + logical_w - win_w - 16.0;
                let y = logical_y + 32.0;

                if i == 0 {
                    // "main" already exists from tauri.conf.json — just set workspace visibility.
                    // Position is handled by the frontend after monitorRef is available.
                    if let Some(window) = app.get_webview_window("main") {
                        window.set_visible_on_all_workspaces(true).ok();
                        log::info!("[startup] configured main window (frontend will position)");
                    }
                } else {
                    // Create additional windows for extra monitors
                    match WebviewWindowBuilder::new(
                        app,
                        &label,
                        WebviewUrl::App("index.html".into()),
                    )
                    .title("Context Maintainer")
                    .inner_size(win_w, win_h)
                    .min_inner_size(180.0, 100.0)
                    .always_on_top(true)
                    .resizable(true)
                    .maximizable(false)
                    .visible_on_all_workspaces(true)
                    .title_bar_style(tauri::TitleBarStyle::Overlay)
                    .hidden_title(true)
                    .traffic_light_position(tauri::Position::Logical(
                        tauri::LogicalPosition::new(-20.0, -20.0),
                    ))
                    .visible(false)
                    .build() {
                        Ok(window) => {
                            window.set_position(tauri::Position::Logical(
                                tauri::LogicalPosition::new(x, y),
                            )).ok();
                            log::info!("[startup] created window '{}' at ({:.0},{:.0})", label, x, y);
                        }
                        Err(e) => {
                            log::error!("[startup] failed to create window '{}': {}", label, e);
                        }
                    }
                }
            }

            // Post-creation diagnostic: log all windows
            let all_windows = app.webview_windows();
            log::info!(
                "[startup] total windows created: {} (labels: {:?})",
                all_windows.len(),
                all_windows.keys().collect::<Vec<_>>()
            );

            // Hide traffic lights with retries so all windows (including late-initialising
            // secondary monitors) have their NSWindow buttons hidden reliably.
            #[cfg(target_os = "macos")]
            {
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    for attempt in 0..3 {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        let windows = app_handle.webview_windows();
                        log::info!(
                            "Hiding traffic lights (attempt {}): {} window(s)",
                            attempt + 1,
                            windows.len()
                        );
                        for window in windows.values() {
                            hide_traffic_lights(window);
                        }
                    }
                });
            }

            // Start NSWorkspace observer for space changes
            start_space_observer(app.handle().clone());

            // Start monitor connect/disconnect observer
            start_monitor_observer(app.handle().clone());

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_desktop, get_todos, save_todos, get_title, save_title, list_all_desktops, list_desktops_grouped, switch_desktop, get_settings, complete_setup, save_color, list_all_spaces, check_accessibility, request_accessibility, save_desktop_count, apply_theme, clear_all_data, start_new_session, get_context_history, restore_context, save_timer_presets, save_notify_settings, save_hidden_panels, get_completed, add_completed, clear_completed])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
