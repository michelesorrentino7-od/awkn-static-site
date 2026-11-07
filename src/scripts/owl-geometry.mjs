export const SRC_W = 700;
export const SRC_H = 800;
export const FEET = 740;

export function owlSize(viewportWidth) {
  const width = viewportWidth < 700 ? 132 : 158;
  const height = width * (SRC_H / SRC_W);
  return { width, height, bodyAbove: height * (FEET / SRC_H) };
}

export function sheetPosition(col, row) {
  // Percentage positions on a 3×3 sheet. 33% lands on the seam between cells.
  return { x: col * 50, y: row * 50 };
}

export function gazeCell(deg) {
  let col = 1;
  let row = 1;
  if (deg > 45 && deg < 135) col = 2;
  else if (deg > 225 && deg < 315) col = 0;
  if (deg > 135 && deg < 225) row = 2;
  else if (deg < 45 || deg > 315) row = 0;
  return { col, row };
}

export function seatPoint(rect, edge = "top") {
  if (edge === "right") return { x: rect.right - 8, y: rect.top + rect.height * 0.4 };
  if (edge === "bottom" || edge === "inside") {
    const x = edge === "inside" ? rect.left + Math.min(rect.width * 0.7, rect.width - 28) : rect.right - 56;
    return { x, y: rect.bottom - (edge === "inside" ? 4 : 2) };
  }
  const inset = Math.min(rect.width * 0.62, rect.width - 36);
  return { x: rect.left + inset, y: rect.top + 1 };
}

export function seatVisible(rect, viewport) {
  return rect.top >= -20 && rect.top < viewport.height - 140 && rect.right > 40 && rect.left < viewport.width - 40;
}

export function clearPerch(point, bodyAbove, headerBottom, viewportHeight, owlWidth, viewportWidth = Infinity) {
  const minY = headerBottom + bodyAbove + 18;
  const maxY = viewportHeight - 12;
  const minX = owlWidth / 2 + 8;
  const maxX = viewportWidth - owlWidth / 2 - 8;
  return {
    x: Math.min(maxX, Math.max(minX, point.x)),
    y: Math.min(maxY, Math.max(minY, point.y)),
  };
}

export function bundledAsset(url) {
  if (typeof url !== "string" || url.length === 0 || url.startsWith("/owl/") || url.includes("raw.githubusercontent.com")) {
    throw new Error("owl assets must be bundled");
  }
  return url;
}
