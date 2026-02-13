import type { AnchorPosition } from "./types";

export const ANCHOR_POSITIONS: AnchorPosition[] = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

export const ANCHOR_LABELS: Record<AnchorPosition, string> = {
  "top-left": "\u2196", "top-center": "\u2191", "top-right": "\u2197",
  "middle-left": "\u2190", "middle-center": "\u25CF", "middle-right": "\u2192",
  "bottom-left": "\u2199", "bottom-center": "\u2193", "bottom-right": "\u2198",
};

export const THEMES: { name: string; colors: string[] }[] = [
  {
    name: "Pastel",
    colors: ["#F5E6A3","#F2B8A0","#A8CCE0","#A8D8B0","#C8A8D8","#F0C8A0","#A0D8D0","#E0B8C8","#B8D0A0","#D0C8E0"],
  },
  {
    name: "Ocean",
    colors: ["#A9D6E5","#89C2D9","#61A5C2","#468FAF","#2C7DA0","#2A6F97","#014F86","#01497C","#013A63","#012A4A"],
  },
  {
    name: "Sunset",
    colors: ["#FFCDB2","#FFB4A2","#E5989B","#B5838D","#6D6875","#FF9E7A","#F4845F","#E76F51","#D4A5A5","#CC8B86"],
  },
  {
    name: "Forest",
    colors: ["#B7E4C7","#95D5B2","#74C69D","#52B788","#40916C","#2D6A4F","#1B4332","#588157","#A3B18A","#344E41"],
  },
  {
    name: "Candy",
    colors: ["#FFB6C1","#FF69B4","#DA70D6","#BA55D3","#9370DB","#7B68EE","#6495ED","#87CEEB","#00BFFF","#FF85A2"],
  },
  {
    name: "Mono",
    colors: ["#E8E8E8","#D0D0D0","#B8B8B8","#A0A0A0","#888888","#707070","#585858","#404040","#303030","#202020"],
  },
  {
    name: "Neon",
    colors: ["#0F3460","#16213E","#1A1A2E","#533483","#2B2D42","#0D0221","#E94560","#00F5D4","#FEE440","#9B5DE5"],
  },
  {
    name: "Earth",
    colors: ["#DEB887","#D2B48C","#C4A882","#CD853F","#D4A574","#BC8F8F","#A0826D","#8B7355","#B87333","#C68B59"],
  },
  {
    name: "Berry",
    colors: ["#F0C6D0","#E8A0B0","#D47A90","#C05470","#A83060","#8B1A4A","#6E1040","#520A30","#7B2D5B","#9B3A72"],
  },
  {
    name: "Retro",
    colors: ["#E8D44D","#E6A23C","#F56C6C","#67C23A","#409EFF","#B37FEB","#F759AB","#36CFC9","#FFA940","#FF7A45"],
  },
  {
    name: "Lavender",
    colors: ["#E6E6FA","#D8BFD8","#DDA0DD","#DA70D6","#BA55D3","#9932CC","#8B008B","#800080","#4B0082","#9370DB"],
  },
  {
    name: "Mintale",
    colors: ["#E0F7F4","#A8E6E1","#7FD8D3","#56CEC5","#3FBFB7","#26B8A9","#1A9B8E","#0F8073","#04695F","#02453D"],
  },
  {
    name: "Coral",
    colors: ["#FFE5D9","#FFD4C4","#FFC4AF","#FFB39A","#FFA285","#FF9170","#FF805B","#FF6F46","#FF5E31","#FF4D1C"],
  },
  {
    name: "Sage",
    colors: ["#E8F5E9","#C8E6C9","#A5D6A7","#81C784","#66BB6A","#4CAF50","#43A047","#388E3C","#2E7D32","#1B5E20"],
  },
  {
    name: "Plum",
    colors: ["#F3E5F5","#E1BEE7","#CE93D8","#BA68C8","#AB47BC","#9C27B0","#8E24AA","#7B1FA2","#6A1B9A","#4A148C"],
  },
  {
    name: "Peach",
    colors: ["#FFEAA7","#FDCB6E","#F9CA24","#F0932B","#EB5757","#FF7675","#FD79A8","#FDCB6E","#E17055","#D63031"],
  },
  {
    name: "Arctic",
    colors: ["#E0F4FF","#B3E5FC","#81D4FA","#4FC3F7","#29B6F6","#03A9F4","#039BE5","#0288D1","#0277BD","#01579B"],
  },
  {
    name: "Burgundy",
    colors: ["#E8D1CD","#E8B9C8","#D89BC8","#C87BB8","#B85CA8","#A83D98","#982E88","#871E78","#760E68","#650358"],
  },
  {
    name: "Lime",
    colors: ["#F1FF6B","#E4FF6E","#D7FF71","#CAFF74","#BDFB77","#B0FF7A","#A3FF7D","#96FF80","#89FF83","#7CFF86"],
  },
  {
    name: "Rust",
    colors: ["#F4DFD0","#E8C4B0","#DCA890","#D08C70","#C47050","#B85430","#AC3810","#9C2F0F","#8C2407","#7C1A00"],
  },
  {
    name: "Slate",
    colors: ["#E8EAED","#D0D5DD","#B8BCC7","#A0A8BB","#8894AF","#7080A3","#586C97","#40588B","#28447F","#103073"],
  },
];

export const DEFAULT_BG = "#F5E6A3";

export const WINDOW_WIDTH = 290;
export const WINDOW_HEIGHT_EXPANDED = 370;
export const WINDOW_HEIGHT_COLLAPSED = 56;
