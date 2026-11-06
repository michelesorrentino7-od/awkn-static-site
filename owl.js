/* Night Owl — one flight cycle, wandering the page. */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var count = 26;
  var root = new URL("./", document.currentScript.src);

  var style = document.createElement("style");
  style.textContent = [
    "#awkn-owl{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}",
    "#awkn-owl .sprite{position:absolute;top:0;left:0;will-change:transform}",
    "#awkn-owl img{position:absolute;top:0;left:0;width:100%;height:auto;pointer-events:none;user-select:none}",
    "#awkn-owl button{position:absolute;inset:0;border:0;padding:0;background:transparent;cursor:pointer;pointer-events:auto}",
    "#awkn-owl .shadow{position:absolute;width:64px;height:16px;margin:-8px 0 0 -32px;border-radius:50%;background:rgba(28,20,40,.28);filter:blur(6px);pointer-events:none}",
    "#awkn-owl .hello{position:absolute;background:#3D1F5C;color:#fff;font:500 13px/1.3 Inter,system-ui,sans-serif;padding:8px 12px;border-radius:14px;white-space:nowrap;pointer-events:none}",
    "#awkn-owl .hello:after{content:'';position:absolute;left:50%;bottom:-5px;margin-left:-5px;border:5px solid transparent;border-top-color:#3D1F5C;border-bottom:0}",
  ].join("");
  document.head.appendChild(style);

  var host = document.createElement("div");
  host.id = "awkn-owl";
  host.innerHTML = '<div class="shadow"></div><div class="sprite"></div><div class="hello" hidden>Night owl.</div>';
  document.body.appendChild(host);

  var sprite = host.querySelector(".sprite");
  var shadow = host.querySelector(".shadow");
  var hello = host.querySelector(".hello");
  var imgs = [];
  for (var i = 0; i < count; i++) {
    var img = new Image();
    img.src = new URL("owl/f" + String(i).padStart(2, "0") + ".png", root).href;
    img.alt = "";
    img.draggable = false;
    sprite.appendChild(img);
    imgs.push(img);
  }
  var button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", "Night Owl. Click for a small hello.");
  sprite.appendChild(button);

  var w = window.innerWidth;
  var h = window.innerHeight;
  var x = w * 0.72;
  var y = Math.min(h * 0.42, 360);
  var vx = 70;
  var vy = 0;
  var tx = x;
  var ty = y;
  var phase = 0;
  var flip = false;
  var pauseUntil = 0;
  var helloUntil = 0;
  var last = performance.now();

  function pick() {
    var pad = 80;
    tx = pad + Math.random() * Math.max(40, window.innerWidth - pad * 2);
    ty = 90 + Math.random() * Math.max(40, window.innerHeight - 220);
  }
  pick();

  button.addEventListener("click", function (event) {
    event.stopPropagation();
    pauseUntil = performance.now() + 1600;
    helloUntil = performance.now() + 2200;
    hello.hidden = false;
  });

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var dw = window.innerWidth;
    var dh = window.innerHeight;
    var size = dw < 700 ? 118 : 168;

    if (!reduced && now > pauseUntil) {
      var dx = tx - x;
      var dy = ty - y;
      var dist = Math.hypot(dx, dy);
      if (dist < 48) pick();
      var speed = 220;
      var inv = 1 / Math.max(dist, 1);
      var accel = Math.min(1, 1.2 * dt);
      vx += (dx * inv * speed - vx) * accel;
      vy += (dy * inv * speed - vy) * accel;
      x += vx * dt;
      y += vy * dt;
    } else {
      vx *= 0.9;
      vy *= 0.9;
    }

    var minX = 20;
    var maxX = dw - 20;
    var minY = 64;
    var maxY = dh - 24;
    if (x < minX) { x = minX; vx = Math.max(0, vx); }
    else if (x > maxX) { x = maxX; vx = Math.min(0, vx); }
    if (y < minY) { y = minY; vy = Math.max(0, vy); }
    else if (y > maxY) { y = maxY; vy = Math.min(0, vy); }

    if (vx < -24) flip = true;
    else if (vx > 24) flip = false;

    if (!reduced) phase += dt * 12;
    var i0 = ((Math.floor(phase) % count) + count) % count;
    var i1 = (i0 + 1) % count;
    var frac = phase - Math.floor(phase);
    var blend = frac * frac * (3 - 2 * frac);
    var active = null;
    for (var n = 0; n < count; n++) {
      var opacity = 0;
      if (!reduced) {
        if (n === i0) opacity = 1 - blend;
        else if (n === i1 && blend > 0.02) opacity = blend;
      } else if (n === 0) {
        opacity = 1;
      }
      imgs[n].style.opacity = opacity.toFixed(3);
      if (opacity > 0.5) active = imgs[n];
    }

    sprite.style.width = size + "px";
    var sh = active ? active.offsetHeight || size : size;
    if (!sh) sh = size * 0.95;
    sprite.style.height = sh + "px";
    var left = x - size / 2;
    var top = y - sh * 0.5 + (reduced ? 0 : Math.sin(now / 340) * 2);
    var bank = Math.max(-8, Math.min(8, vx / 80));
    var breathe = 1 + Math.sin(now / 260) * 0.008;
    sprite.style.transform =
      "translate3d(" + left + "px," + top + "px,0) rotate(" + bank + "deg) scaleX(" + (flip ? -breathe : breathe) + ")";
    shadow.style.transform = "translate3d(" + x + "px," + (y + 8) + "px,0)";
    shadow.style.opacity = "0.22";

    if (now > helloUntil) hello.hidden = true;
    if (!hello.hidden) {
      hello.style.transform = "translate3d(" + x + "px," + (top - 8) + "px,0) translate(-50%,-100%)";
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
