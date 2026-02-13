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
];

export const DEFAULT_BG = "#F5E6A3";
