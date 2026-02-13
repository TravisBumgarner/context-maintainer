use std::collections::HashMap;
use std::ffi::c_void;
use std::fs;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;
use tauri::{WebviewUrl, WebviewWindowBuilder};
use tauri::Manager;

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

// ── Private CoreGraphics API (space detection + key events) ─────
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGSMainConnectionID() -> i32;
    fn CGSCopyManagedDisplaySpaces(cid: i32) -> *const c_void;
    fn CGEventCreateKeyboardEvent(source: *const c_void, virtual_key: u16, key_down: bool) -> *mut c_void;
    fn CGEventSetFlags(event: *mut c_void, flags: u64);
    fn CGEventPost(tap: u32, event: *mut c_void);
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
/// Returns the stable `id64` for the active space on the given display.
fn space_id_for_display(target_display: usize) -> i64 {
    unsafe {
        let conn = CGSMainConnectionID();
        if conn == 0 {
            return 0;
        }

        let displays = CGSCopyManagedDisplaySpaces(conn);
        if displays.is_null() {
            return 0;
        }
        let display_count = CFArrayGetCount(displays) as usize;
        if display_count == 0 {
            CFRelease(displays);
            return 0;
        }

        let key_current = cf_str("Current Space");
        let key_id = cf_str("id64");

        let clamped = if target_display < display_count { target_display } else { 0 };
        let disp = CFArrayGetValueAtIndex(displays, clamped as isize);
        let current_space = CFDictionaryGetValue(disp, key_current);
        let mut active_id: i64 = 0;
        if !current_space.is_null() {
            let id_ptr = CFDictionaryGetValue(current_space, key_id);
            if !id_ptr.is_null() {
                CFNumberGetValue(id_ptr, CF_NUMBER_SINT64, &mut active_id as *mut _ as *mut c_void);
            }
        }

        CFRelease(key_current);
        CFRelease(key_id);
        CFRelease(displays);
        active_id
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

// ── Keyboard simulation (Ctrl+Number to switch space) ─────────

const CG_EVENT_FLAG_MASK_CONTROL: u64 = 0x40000;

fn digit_keycode(n: u32) -> Option<u16> {
    match n {
        1 => Some(18), 2 => Some(19), 3 => Some(20),
        4 => Some(21), 5 => Some(23), 6 => Some(22),
        7 => Some(26), 8 => Some(28), 9 => Some(25),
        _ => None,
    }
}

fn simulate_ctrl_number(n: u32) {
    let Some(keycode) = digit_keycode(n) else { return };
    unsafe {
        let down = CGEventCreateKeyboardEvent(std::ptr::null(), keycode, true);
        if !down.is_null() {
            CGEventSetFlags(down, CG_EVENT_FLAG_MASK_CONTROL);
            CGEventPost(0, down);
            CFRelease(down as *const c_void);
        }
        let up = CGEventCreateKeyboardEvent(std::ptr::null(), keycode, false);
        if !up.is_null() {
            CGEventSetFlags(up, CG_EVENT_FLAG_MASK_CONTROL);
            CGEventPost(0, up);
            CFRelease(up as *const c_void);
        }
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

fn default_desktop_count() -> u32 { 10 }

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Settings {
    custom_colors: HashMap<i64, String>,
    setup_complete: bool,
    #[serde(default = "default_desktop_count")]
    desktop_count: u32,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            custom_colors: HashMap::new(),
            setup_complete: false,
            desktop_count: 10,
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
}

fn default_color(position: u32) -> String {
    COLORS[(position as usize) % COLORS.len()].to_string()
}

#[tauri::command]
fn get_desktop(state: tauri::State<'_, AppState>, display: u32) -> DesktopInfo {
    let sid = space_id_for_display(display as usize);
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
    let spaces = enumerate_spaces();
    for &(sid, disp, local) in &spaces {
        if sid == target && disp == display as usize && local <= 9 {
            simulate_ctrl_number(local);
            return true;
        }
    }
    false
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

// ── Entry point ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Persistence setup
            let data_dir = app.path().app_data_dir().expect("no app data dir");
            fs::create_dir_all(&data_dir).ok();
            let data_path = data_dir.join("notes.json");
            let data_path_str = data_path.to_string_lossy().to_string();
            let mut data = load_data(&data_path_str);

            // Migrate v0 → v1 (positional index → space id64)
            if data.version < 1 {
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

            // System tray icon — click to toggle ALL windows
            let icon = Image::from_path("icons/32x32.png")
                .or_else(|_| Image::from_path("src-tauri/icons/32x32.png"))
                .unwrap_or_else(|_| Image::from_bytes(include_bytes!("../icons/32x32.png")).expect("embedded icon"));

            TrayIconBuilder::new()
                .icon(icon)
                .tooltip("Context Maintainer")
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { button_state, .. } = event {
                        // Only toggle on mouse-up to avoid double-firing
                        if button_state != tauri::tray::MouseButtonState::Up {
                            return;
                        }
                        let app = tray.app_handle();
                        let windows = app.webview_windows();
                        let any_visible = windows.values()
                            .any(|w| w.is_visible().unwrap_or(false));
                        for window in windows.values() {
                            if any_visible {
                                window.hide().ok();
                            } else {
                                window.show().ok();
                                window.set_focus().ok();
                            }
                        }
                    }
                })
                .build(app)?;

            // Create one window per monitor
            let monitors = app.available_monitors()?;
            let win_w = 240.0_f64;
            let win_h = 320.0_f64;

            for (i, monitor) in monitors.iter().enumerate() {
                let label = if i == 0 { "main".to_string() } else { format!("monitor-{}", i) };

                let m_pos = monitor.position();
                let m_size = monitor.size();
                let scale = monitor.scale_factor();

                let logical_x = m_pos.x as f64 / scale;
                let logical_y = m_pos.y as f64 / scale;
                let logical_w = m_size.width as f64 / scale;

                let x = logical_x + logical_w - win_w - 16.0;
                let y = logical_y + 32.0;

                if i == 0 {
                    // "main" already exists from tauri.conf.json — just position it
                    if let Some(window) = app.get_webview_window("main") {
                        window.set_visible_on_all_workspaces(true).ok();
                        window
                            .set_position(tauri::Position::Logical(
                                tauri::LogicalPosition::new(x, y),
                            ))
                            .ok();
                    }
                } else {
                    // Create additional windows for extra monitors
                    let window = WebviewWindowBuilder::new(
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
                    .build()?;

                    // Position after creation — builder .position() doesn't
                    // reliably place windows on secondary monitors on macOS.
                    window.set_position(tauri::Position::Logical(
                        tauri::LogicalPosition::new(x, y),
                    )).ok();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_desktop, get_todos, save_todos, get_title, save_title, list_all_desktops, list_desktops_grouped, switch_desktop, get_settings, complete_setup, save_color, list_all_spaces, check_accessibility, request_accessibility, save_desktop_count, apply_theme, clear_all_data, start_new_session, get_context_history, restore_context])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
