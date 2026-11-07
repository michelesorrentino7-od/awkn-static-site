import { bundledAsset, clearPerch, gazeCell, owlSize, seatPoint, seatVisible } from "./owl-geometry.mjs";

const POSES = ["takeoff", "flight", "landing"];

function readAssets(assets) {
  return {
    directions: bundledAsset(assets.directions),
    reactions: bundledAsset(assets.reactions),
    takeoff: bundledAsset(assets.takeoff),
    flight: bundledAsset(assets.flight),
    landing: bundledAsset(assets.landing),
  };
}

export function mountOwl(assets, doc = document) {
  const urls = readAssets(assets);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const layer = doc.createElement("div");
  layer.className = "owl-layer";

  const shadow = doc.createElement("div");
  shadow.className = "owl-shadow";
  const rig = doc.createElement("div");
  rig.className = "owl-rig";
  const sheet = doc.createElement("div");
  sheet.className = "owl-sheet";
  rig.appendChild(sheet);

  const poseImages = POSES.map((name) => {
    const img = doc.createElement("img");
    img.className = "owl-pose";
    img.dataset.pose = name;
    img.src = urls[name];
    img.alt = "";
    img.draggable = false;
    rig.appendChild(img);
    return img;
  });

  const button = doc.createElement("button");
  button.type = "button";
  button.className = "owl-hit";
  button.setAttribute("aria-label", "The owl. Click for a small hello.");
  rig.appendChild(button);

  const bubble = doc.createElement("div");
  bubble.className = "owl-line";
  bubble.setAttribute("role", "status");
  bubble.setAttribute("aria-live", "polite");

  layer.append(shadow, rig, bubble);
  doc.body.appendChild(layer);

  let running = true;
  let frame = 0;
  const first = doc.querySelector('[data-seat="mast"]') || doc.querySelector("[data-seat]");
  const opening = first ? perchFor(first) : corner();
  let x = opening.x;
  let y = opening.y;
  let vx = 0;
  let vy = 0;
  let tx = x;
  let ty = y;
  let seat = first;
  let flying = false;
  let mode = "sit";
  let modeT = 0;
  let boredAt = performance.now() + 16000;
  let hopT = -1;
  let reactionUntil = 0;
  let idleLookAt = performance.now() + 4000 + Math.random() * 4000;
  let flip = false;
  let last = performance.now();
  let sayUntil = 0;
  const pointer = { x: 0, y: 0, on: false };

  const say = (text) => {
    bubble.textContent = text;
    bubble.classList.toggle("is-on", Boolean(text));
    sayUntil = text ? performance.now() + 1600 : 0;
  };

  const showSheet = (image, col, row) => {
    sheet.style.backgroundImage = `url("${image}")`;
    sheet.style.backgroundPosition = `${col * 33.33}% ${row * 33.33}%`;
    sheet.style.opacity = "1";
    for (const img of poseImages) img.style.opacity = "0";
  };

  const showPose = (name) => {
    sheet.style.opacity = "0";
    for (const img of poseImages) img.style.opacity = img.dataset.pose === name ? "1" : "0";
  };

  showSheet(urls.directions, 1, 1);

  const pickSeat = () => {
    const visible = [...doc.querySelectorAll("[data-seat]")].filter((el) => {
      if (el === seat) return false;
      return seatVisible(el.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight });
    });
    if (!visible.length) return null;
    const mid = window.innerHeight * 0.42;
    visible.sort(
      (a, b) => Math.abs(a.getBoundingClientRect().top - mid) - Math.abs(b.getBoundingClientRect().top - mid),
    );
    return visible[0];
  };

  const takeoff = () => {
    if (flying || mode !== "sit" || reduced) return;
    const next = pickSeat();
    if (!next) return;
    seat = next;
    const p = perchFor(next);
    tx = p.x;
    ty = p.y;
    flying = true;
    mode = "takeoff";
    modeT = 0;
    flip = tx < x - 12;
    showPose("takeoff");
  };

  const hop = () => {
    if (flying || mode !== "sit") return;
    hopT = 0;
    reactionUntil = performance.now() + 650;
    const col = Math.floor(Math.random() * 3);
    const row = Math.floor(Math.random() * 3);
    showSheet(urls.reactions, col, row);
    say("Night owl.");
  };

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    hop();
  });

  const onMove = (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.on = true;
  };
  const onLeave = (event) => {
    if (!event.relatedTarget) pointer.on = false;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerout", onLeave);

  const tick = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (sayUntil && now > sayUntil) say("");

    const near = pointer.on && Math.hypot(pointer.x - x, pointer.y - y) < 220;
    if (!flying && seat && !seatVisible(seat.getBoundingClientRect(), viewport()) && !near && !reduced) takeoff();
    if (!flying && !seat && !near && !reduced) takeoff();
    if (!flying && !near && !reduced && now > boredAt) takeoff();

    if (flying && seat && !seatVisible(seat.getBoundingClientRect(), viewport())) {
      const next = pickSeat();
      seat = next;
      if (!next) {
        const c = corner();
        tx = c.x;
        ty = c.y;
      }
    }
    if (flying && seat) {
      const p = perchFor(seat);
      tx = p.x;
      ty = p.y;
    } else if (!flying && seat && seatVisible(seat.getBoundingClientRect(), viewport())) {
      const p = perchFor(seat);
      tx = p.x;
      ty = p.y;
    } else if (!flying && !seat) {
      const c = corner();
      tx = c.x;
      ty = c.y;
    }

    const dist = Math.hypot(tx - x, ty - y);
    if ((mode === "takeoff" || mode === "fly") && !reduced) {
      const accel = Math.min(1, 2.2 * dt);
      const scale = Math.max(1, dist);
      vx += (((tx - x) / scale) * 480 - vx) * accel;
      vy += (((ty - y) / scale) * 480 - vy) * accel;
      x += vx * dt;
      y += vy * dt;
    } else {
      const follow = Math.min(1, dt * 7);
      x += (tx - x) * follow;
      y += (ty - y) * follow;
      vx *= 0.6;
      vy *= 0.6;
    }

    if (mode === "takeoff") {
      modeT += dt;
      if (modeT > 0.42) {
        mode = dist < 50 ? "land" : "fly";
        modeT = 0;
        showPose(mode === "fly" ? "flight" : "landing");
      }
    } else if (mode === "fly") {
      if (dist < 40) {
        mode = "land";
        modeT = 0;
        showPose("landing");
      } else if (vx < -24) flip = true;
      else if (vx > 24) flip = false;
    } else if (mode === "land") {
      modeT += dt;
      if (modeT > 0.46) {
        mode = "sit";
        flying = false;
        vx = 0;
        vy = 0;
        x = tx;
        y = ty;
        boredAt = now + 10000 + Math.random() * 6000;
        modeT = 0;
        showSheet(urls.directions, 1, 1);
      }
    }

    if (mode === "sit") {
      if (hopT >= 0) {
        hopT += dt;
        if (hopT > 0.5 && reactionUntil <= now) {
          hopT = -1;
          showSheet(urls.directions, 1, 1);
        }
      }
      if (reactionUntil > now) {
        // The reaction sheet stays up for the hop.
      } else if (near) {
        const angle = Math.atan2(pointer.y - y, pointer.x - x);
        const deg = (angle * 180) / Math.PI;
        const wrapped = (deg + 360) % 360;
        const cell = gazeCell(wrapped);
        showSheet(urls.directions, cell.col, cell.row);
        boredAt = Math.max(boredAt, now + 7000);
        idleLookAt = now + 5000;
      } else if (now > idleLookAt) {
        const col = Math.floor(Math.random() * 3);
        const row = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 1;
        showSheet(urls.directions, col, row);
        idleLookAt = now + 3000 + Math.random() * 5000;
      }
    }

    const size = owlSize(window.innerWidth);
    const left = x - size.width / 2;
    const top = y - size.bodyAbove;
    const hopY = hopT >= 0 && hopT <= 0.5 ? -Math.sin((hopT / 0.5) * Math.PI) * 14 : 0;
    rig.style.width = `${size.width}px`;
    rig.style.height = `${size.height}px`;
    rig.style.transform = `translate3d(${left}px, ${top + hopY}px, 0) scaleX(${flip ? -1 : 1})`;
    shadow.style.transform = `translate3d(${x}px, ${y + 2}px, 0)`;
    shadow.style.opacity = mode === "sit" ? "0.22" : "0.12";
    bubble.style.transform = `translate3d(${x}px, ${top - 4}px, 0) translate(-50%, -100%)`;

    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return () => {
    running = false;
    cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerout", onLeave);
    layer.remove();
  };
}

function viewport() {
  return { width: window.innerWidth, height: window.innerHeight };
}

function headerBottom() {
  const header = document.querySelector(".site-header");
  return header ? header.getBoundingClientRect().bottom : 0;
}

const COPY = "h1, h2, h3, .lede, .button, .header-buy, .nav-toggle";

function coversCopy(point, size) {
  const box = {
    left: point.x - size.width / 2,
    right: point.x + size.width / 2,
    top: point.y - size.bodyAbove,
    bottom: point.y - size.height * 0.12,
  };
  return [...document.querySelectorAll(COPY)].some((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    return box.left < rect.right && box.right > rect.left && box.top < rect.bottom && box.bottom > rect.top;
  });
}

function perchFor(el) {
  const size = owlSize(window.innerWidth);
  const rect = el.getBoundingClientRect();
  const edge = el.dataset.seatEdge || "top";
  const fit = (name) =>
    clearPerch(seatPoint(rect, name), size.bodyAbove, headerBottom(), window.innerHeight, size.width, window.innerWidth);
  const point = fit(edge);
  if (edge === "inside" || !coversCopy(point, size)) return point;
  return fit("inside");
}

function corner() {
  const size = owlSize(window.innerWidth);
  return clearPerch(
    { x: window.innerWidth - 72, y: window.innerHeight - 24 },
    size.bodyAbove,
    headerBottom(),
    window.innerHeight,
    size.width,
    window.innerWidth,
  );
}
