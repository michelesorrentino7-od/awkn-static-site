/* Night Owl — sprite-sheet companion for the AWKN static site.
   Uses owl-directions.webp (3x3) for gaze while perched.
   Uses owl-reactions.webp briefly on click.
   Flight still uses individual pose images from owl/poses/*.js
   Sheets loaded from owl-mascot repo for immediate availability.
   Perch next to the N of AWKN (level with the letter, not below).
*/
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SRC_W = 700, SRC_H = 800, FEET = 740;
  var POSES = ["alert", "takeoff", "flight", "landing"];
  var root = new URL("./", document.currentScript.src);
  var DEAD_ZONE = 80;
  var DIR_SHEET = "https://raw.githubusercontent.com/michelesorrentino7-od/owl-mascot/main/public/owl/mascots/owl-directions.webp";
  var REACT_SHEET = "https://raw.githubusercontent.com/michelesorrentino7-od/owl-mascot/main/public/owl/mascots/owl-reactions.webp";

  function cell(col, row) {
    return (col * 33.33) + "% " + (row * 33.33) + "%";
  }

  function boot() {
    var POSE_SRC = window.AWKN_POSES || {};
    var style = document.createElement("style");
    style.textContent = [
      "#awkn-owl{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}",
      "#awkn-owl .sprite{position:absolute;top:0;left:0;will-change:transform}",
      "#awkn-owl .sheet{position:absolute;inset:0;background-size:300% 300%;background-repeat:no-repeat;pointer-events:none}",
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

    // Directions sheet
    var dirSheet = document.createElement("div");
    dirSheet.className = "sheet";
    dirSheet.style.backgroundImage = "url(" + DIR_SHEET + ")";
    dirSheet.style.backgroundPosition = cell(1, 1);
    sprite.appendChild(dirSheet);

    // Reactions sheet
    var reactSheet = document.createElement("div");
    reactSheet.className = "sheet";
    reactSheet.style.backgroundImage = "url(" + REACT_SHEET + ")";
    reactSheet.style.opacity = "0";
    sprite.appendChild(reactSheet);

    var imgs = {};
    POSES.forEach(function (name) {
      var img = new Image();
      img.src = POSE_SRC[name];
      img.alt = "";
      img.draggable = false;
      img.style.opacity = "0";
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
      // Special perch for the logo mast: next to the N, level with the letter (not below)
      if (el.dataset.seat === "mast") {
        // Place feet roughly at the vertical center of the logo text, just after the N
        return { x: r.right - 22, y: r.top + r.height * 0.42 };
      }
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
    var reactionUntil = 0;
    var current = "perch";
    var pointer = { x: 0, y: 0, on: false };
    var showReaction = false;

    function show(next) {
      if (next === current) return;
      current = next;
      POSES.forEach(function (name) {
        imgs[name].style.opacity = (name === next && !showReaction) ? "1" : "0";
      });
    }
    function pickSeat() {
      var all = Array.prototype.filter.call(document.querySelectorAll("[data-seat]"), function (el) {
        return el !== seat && seatVisible(el);
      });
      if (!all.length) return null;
      // Prefer seats that are closer horizontally for cleaner routes
      var midY = window.innerHeight * 0.42;
      all.sort(function (a, b) {
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        var da = Math.abs(ra.top - midY) + Math.abs(ra.left - x) * 0.4;
        var db = Math.abs(rb.top - midY) + Math.abs(rb.left - x) * 0.4;
        return da - db;
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
      showReaction = false;
      reactSheet.style.opacity = "0";
      dirSheet.style.opacity = "1";
    }

    button.addEventListener("click", function (event) {
      event.stopPropagation();
      if (flying || mode !== "sit") return;
      hopT = 0;
      show("alert");
      hello.hidden = false;
      helloUntil = performance.now() + 1600;
      // Reaction sheet
      showReaction = true;
      reactionUntil = performance.now() + 650;
      dirSheet.style.opacity = "0";
      reactSheet.style.opacity = "1";
      var cells = [[1,0],[0,1],[2,1],[1,2]];
      var pick = cells[Math.floor(Math.random() * cells.length)];
      reactSheet.style.backgroundPosition = cell(pick[0], pick[1]);
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
      if (reactionUntil && now > reactionUntil) {
        reactionUntil = 0;
        showReaction = false;
        reactSheet.style.opacity = "0";
        dirSheet.style.opacity = "1";
      }

      var near = pointer.on && Math.hypot(pointer.x - x, pointer.y - y) < 220;
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
        vx += ((tx - x) / d * 420 - vx) * accel; // slightly slower for cleaner routes
        vy += ((ty - y) / d * 420 - vy) * accel;
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

      // Tracking while sitting
      if (mode === "sit" && !showReaction) {
        if (near && pointer.on) {
          var dx = pointer.x - x;
          var dy = pointer.y - y;
          var distToMouse = Math.hypot(dx, dy);
          if (distToMouse < DEAD_ZONE) {
            dirSheet.style.backgroundPosition = cell(1, 1);
          } else {
            var angle = Math.atan2(dy, dx);
            var deg = (angle * 180 / Math.PI + 360) % 360;
            var col = 1, row = 1;
            if (deg > 30 && deg < 150) col = 2;
            else if (deg > 210 && deg < 330) col = 0;
            if (deg > 120 && deg < 240) row = 2;
            else if (deg < 60 || deg > 300) row = 0;
            dirSheet.style.backgroundPosition = cell(col, row);
          }
          boredAt = Math.max(boredAt, now + 7000);
        } else {
          dirSheet.style.backgroundPosition = cell(1, 1);
        }
        dirSheet.style.opacity = "1";
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
