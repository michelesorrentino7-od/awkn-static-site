/* Night Owl — pose-based companion for the AWKN static site.
   Sits on [data-seat], looks at the pointer, flies only when the seat leaves.
   Pose data is loaded from owl/poses/*.js */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SRC_W = 359, SRC_H = 411, FEET = 380;
  var POSES = ["perch","look-left","look-right","alert","takeoff","flight","landing"];
  var root = new URL("./", document.currentScript.src);

  function boot() {
    var POSE_SRC = window.AWKN_POSES || {};
  var style = document.createElement("style");
  style.textContent = [
    "#awkn-owl{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}",
    "#awkn-owl .sprite{position:absolute;top:0;left:0;will-change:transform}",
    "#awkn-owl img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;user-select:none;transition:opacity .2s}",
    "#awkn-owl button{position:absolute;left:12%;right:12%;top:8%;bottom:14%;border:0;padding:0;background:transparent;cursor:pointer;pointer-events:auto}",
    "#awkn-owl .shadow{position:absolute;width:56px;height:14px;margin:-7px 0 0 -28px;border-radius:50%;background:rgba(61,31,92,.28);filter:blur(5px);pointer-events:none}",
    "#awkn-owl .hello{position:absolute;background:#3D1F5C;color:#fff;font:500 13px/1.3 Inter,system-ui,sans-serif;padding:8px 12px;border-radius:14px;white-space:nowrap;pointer-events:none}",
    "#awkn-owl .hello:after{content:'';position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-top-color:#3D1F5C;border-bottom:0}"
  ].join("");
  document.head.appendChild(style);

  var host = document.createElement("div");
  host.id = "awkn-owl";
  host.innerHTML = '<div class="shadow"></div><div class="sprite"></div><div class="hello" hidden>Night owl.</div>';
  document.body.appendChild(host);

  var sprite = host.querySelector(".sprite");
  var shadow = host.querySelector(".shadow");
  var hello = host.querySelector(".hello");
  var imgs = {};
  POSES.forEach(function (name) {
    var img = new Image();
    img.src = POSE_SRC[name];
    img.alt = "";
    img.draggable = false;
    img.style.opacity = name === "perch" ? "1" : "0";
    sprite.appendChild(img);
    imgs[name] = img;
  });
  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Night Owl. Click for a small hello.");
  sprite.appendChild(button);

  function seatPoint(el) {
    var r = el.getBoundingClientRect();
    var edge = el.dataset.seatEdge || "top";
    if (edge === "right") return { x: r.right - 8, y: r.top + r.height * 0.4 };
    if (edge === "bottom") return { x: r.right - 56, y: r.bottom - 2 };
    return { x: r.left + Math.min(r.width * 0.62, r.width - 36), y: r.top + 1 };
  }
  function seatVisible(el) {
    var r = el.getBoundingClientRect();
    return r.top >= -20 && r.top < window.innerHeight - 140 && r.right > 40 && r.left < window.innerWidth - 40;
  }
  function corner() {
    return { x: window.innerWidth - 72, y: window.innerHeight - 24 };
  }

  var first = document.querySelector('[data-seat="mast"]') || document.querySelector("[data-seat]");
  var start = first ? seatPoint(first) : { x: 120, y: 48 };
  var x = start.x, y = start.y, vx = 0, vy = 0, tx = x, ty = y;
  var seat = first;
  var flying = false;
  var mode = "sit";
  var modeT = 0;
  var boredAt = performance.now() + 16000;
  var hopT = -1;
  var flip = false;
  var last = performance.now();
  var helloUntil = 0;
  var current = "perch";
  var pointer = { x: 0, y: 0, on: false };

  function show(next) {
    if (next === current) return;
    current = next;
    POSES.forEach(function (name) {
      imgs[name].style.opacity = name === next ? "1" : "0";
    });
  }
  function pickSeat() {
    var all = Array.prototype.filter.call(document.querySelectorAll("[data-seat]"), function (el) {
      return el !== seat && seatVisible(el);
    });
    if (!all.length) return null;
    var mid = window.innerHeight * 0.42;
    all.sort(function (a, b) {
      return Math.abs(a.getBoundingClientRect().top - mid) - Math.abs(b.getBoundingClientRect().top - mid);
    });
    return all[0];
  }
  function takeoff() {
    if (flying || mode !== "sit" || reduced) return;
    var next = pickSeat();
    if (next) {
      seat = next;
      var p = seatPoint(next);
      tx = p.x; ty = p.y;
    } else {
      seat = null;
      var c = corner();
      tx = c.x; ty = c.y;
    }
    flying = true;
    mode = "takeoff";
    modeT = 0;
    flip = tx < x - 12;
    show("takeoff");
  }

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    if (flying || mode !== "sit") return;
    hopT = 0;
    show("alert");
    hello.hidden = false;
    helloUntil = performance.now() + 1600;
  });
  window.addEventListener("pointermove", function (e) {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.on = true;
  }, { passive: true });
  window.addEventListener("pointerout", function (e) {
    if (!e.relatedTarget) pointer.on = false;
  });

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (now > helloUntil) hello.hidden = true;

    var near = pointer.on && Math.hypot(pointer.x - x, pointer.y - y) < 200;
    if (!flying && seat && !seatVisible(seat) && !near && !reduced) takeoff();
    if (!flying && !seat && !near && !reduced) takeoff();
    if (!flying && !near && !reduced && now > boredAt) takeoff();

    if (flying && seat && !seatVisible(seat)) {
      var next = pickSeat();
      seat = next;
      if (!next) { var c = corner(); tx = c.x; ty = c.y; }
    }
    if (flying && seat) {
      var p = seatPoint(seat); tx = p.x; ty = p.y;
    } else if (!flying && seat && seatVisible(seat)) {
      var p2 = seatPoint(seat); tx = p2.x; ty = p2.y;
    } else if (!flying && !seat) {
      var c2 = corner(); tx = c2.x; ty = c2.y;
    }

    var dist = Math.hypot(tx - x, ty - y);
    if ((mode === "takeoff" || mode === "fly") && !reduced) {
      var d = Math.max(1, dist);
      var accel = Math.min(1, 2.2 * dt);
      vx += ((tx - x) / d * 480 - vx) * accel;
      vy += ((ty - y) / d * 480 - vy) * accel;
      x += vx * dt; y += vy * dt;
    } else {
      var follow = Math.min(1, dt * 7);
      x += (tx - x) * follow;
      y += (ty - y) * follow;
      vx *= 0.6; vy *= 0.6;
    }

    if (mode === "takeoff") {
      modeT += dt;
      if (modeT > 0.42) {
        mode = dist < 50 ? "land" : "fly";
        modeT = 0;
        show(mode === "fly" ? "flight" : "landing");
      }
    } else if (mode === "fly") {
      if (dist < 40) { mode = "land"; modeT = 0; show("landing"); }
      else if (vx < -24) flip = true;
      else if (vx > 24) flip = false;
    } else if (mode === "land") {
      modeT += dt;
      if (modeT > 0.46) {
        mode = "sit"; flying = false; vx = 0; vy = 0; x = tx; y = ty;
        boredAt = now + 10000 + Math.random() * 6000;
        modeT = 0;
        show("perch");
      }
    }

    if (mode === "sit") {
      if (hopT >= 0) {
        hopT += dt;
        if (hopT > 0.5) { hopT = -1; show("perch"); }
      } else if (near) {
        show(pointer.x < x - 16 ? "look-left" : pointer.x > x + 16 ? "look-right" : "perch");
        boredAt = Math.max(boredAt, now + 7000);
      } else if (current !== "perch") {
        show("perch");
      }
    }

    var width = window.innerWidth < 700 ? 120 : 148;
    var height = width * (SRC_H / SRC_W);
    var left = x - width / 2;
    var top = y - (FEET / SRC_H) * height;
    var hopY = hopT >= 0 ? -Math.sin((hopT / 0.5) * Math.PI) * 12 : 0;
    sprite.style.width = width + "px";
    sprite.style.height = height + "px";
    sprite.style.transform = "translate3d(" + left + "px," + (top + hopY) + "px,0) scaleX(" + (flip ? -1 : 1) + ")";
    shadow.style.transform = "translate3d(" + x + "px," + (y + 2) + "px,0)";
    shadow.style.opacity = mode === "sit" ? "0.22" : "0.12";
    if (!hello.hidden) {
      hello.style.transform = "translate3d(" + x + "px," + (top - 4) + "px,0) translate(-50%,-100%)";
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  }

  var left = POSES.length;
  window.AWKN_POSES = window.AWKN_POSES || {};
  POSES.forEach(function (name) {
    var s = document.createElement("script");
    s.src = new URL("owl/poses/" + name + ".js", root).href;
    s.onload = function () { if (--left === 0) boot(); };
    s.onerror = function () { if (--left === 0) boot(); };
    document.head.appendChild(s);
  });
})();
