import assert from "node:assert/strict";
import test from "node:test";
import {
  FEET,
  SRC_H,
  SRC_W,
  bundledAsset,
  clearPerch,
  gazeCell,
  owlSize,
  sheetPosition,
  seatPoint,
  seatVisible,
} from "./owl-geometry.mjs";

test("owl size stays constant for the painted canvas", () => {
  const desktop = owlSize(1100);
  const phone = owlSize(390);
  assert.equal(desktop.width, 158);
  assert.equal(phone.width, 132);
  assert.equal(desktop.height, 158 * (SRC_H / SRC_W));
  assert.equal(desktop.bodyAbove, desktop.height * (FEET / SRC_H));
  assert.equal(phone.bodyAbove, phone.height * (FEET / SRC_H));
});

test("gaze sheet uses the same angle buckets as the mascot", () => {
  assert.deepEqual(gazeCell(0), { col: 1, row: 0 });
  assert.deepEqual(gazeCell(90), { col: 2, row: 1 });
  assert.deepEqual(gazeCell(180), { col: 1, row: 2 });
  assert.deepEqual(gazeCell(270), { col: 0, row: 1 });
  assert.deepEqual(gazeCell(20), { col: 1, row: 0 });
});

test("a 3 by 3 sheet lands on a whole owl, not the seam between cells", () => {
  assert.deepEqual(sheetPosition(1, 1), { x: 50, y: 50 });
  assert.deepEqual(sheetPosition(0, 0), { x: 0, y: 0 });
  assert.deepEqual(sheetPosition(2, 2), { x: 100, y: 100 });
  assert.notEqual(sheetPosition(1, 1).y, 33.33);
});

test("seat point follows the marked edge", () => {
  const rect = { left: 100, top: 200, right: 300, bottom: 500, width: 200, height: 300 };
  assert.deepEqual(seatPoint(rect, "top"), { x: 100 + 124, y: 201 });
  assert.deepEqual(seatPoint(rect, "right"), { x: 292, y: 200 + 120 });
  assert.deepEqual(seatPoint(rect, "bottom"), { x: 244, y: 498 });
  assert.deepEqual(seatPoint(rect, "inside"), { x: 240, y: 496 });
});

test("a seat is visible only while it sits in the middle band of the screen", () => {
  const viewport = { width: 1200, height: 800 };
  assert.equal(seatVisible({ left: 80, top: 100, right: 400, bottom: 300 }, viewport), true);
  assert.equal(seatVisible({ left: 80, top: -21, right: 400, bottom: 80 }, viewport), false);
  assert.equal(seatVisible({ left: 80, top: 700, right: 400, bottom: 900 }, viewport), false);
});

test("the perch drops below the sticky header so the whole painting stays on screen", () => {
  const placed = clearPerch({ x: 180, y: 12 }, 167, 76, 800, 158);
  assert.equal(placed.y, 76 + 167 + 18);
  assert.ok(placed.y - 167 >= 76);
  assert.equal(clearPerch({ x: 180, y: 420 }, 167, 76, 800, 158).y, 420);
  assert.equal(clearPerch({ x: 180, y: 2000 }, 167, 76, 800, 158).y, 788);
});

test("a wide owl is kept inside the viewport", () => {
  const placed = clearPerch({ x: 4, y: 420 }, 140, 76, 800, 132);
  assert.equal(placed.x, 74);
});

test("owl files are the bundled copies, not a root path or the GitHub raw host", () => {
  assert.equal(bundledAsset("_astro/owl-directions.webp"), "_astro/owl-directions.webp");
  assert.throws(() => bundledAsset("/owl/mascots/owl-directions.webp"), /bundled/);
  assert.throws(() => bundledAsset("https://raw.githubusercontent.com/michelesorrentino7-od/owl-mascot/main/public/owl/mascots/owl-directions.webp"), /bundled/);
});
