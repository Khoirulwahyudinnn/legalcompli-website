/*
 * About section: animated dot fields (the two decorative .about__dots patterns).
 *
 * The dot positions come from the original SVG (1368 dots, white at 10% opacity); each
 * <img> is swapped for a <canvas> with the same classes, so the CSS layout and the GSAP
 * scroll drift in main.js keep working. Three layered, subtle effects:
 *   1. shimmer  — a soft diagonal light wave drifts slowly through the field
 *   2. twinkle  — about a quarter of the dots sparkle on their own random rhythm
 *   3. spotlight — on mouse/trackpad, dots near the cursor glow in the brand orange
 * Runs only while the About section is on screen; prefers-reduced-motion → static dots.
 * If anything fails (no canvas, fetch error) the original <img> stays visible.
 */
export function initAboutDots() {
  var section = document.querySelector(".about");
  if (!section) return;
  var imgs = Array.prototype.slice.call(section.querySelectorAll("img.about__dots"));
  if (!imgs.length) return;

  var SIZE = 679;             // SVG viewBox
  var BASE_ALPHA = 0.1;       // the design's dot opacity
  var DOT_R = 2.24;
  var SPOT_R = 170;           // spotlight radius (px, in pattern space)
  var GLOW = [254, 133, 0];   // --orange-strong #fe8500

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  var layers = imgs.map(function (img) {
    var c = document.createElement("canvas");
    c.className = img.className;
    c.setAttribute("aria-hidden", "true");
    img.parentNode.insertBefore(c, img.nextSibling);
    img.className = "";
    img.style.display = "none";
    return { canvas: c, ctx: c.getContext("2d"), img: img, mx: 0, my: 0, spot: 0, spotTarget: 0 };
  });

  var dots = null; // Float32Array [x, y, phase, speed, amp, ...]

  function sizeCanvases() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    layers.forEach(function (l) {
      l.canvas.width = Math.round(SIZE * dpr);
      l.canvas.height = Math.round(SIZE * dpr);
      l.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  function draw(t) {
    if (!dots) return;
    var n = dots.length / 5;
    layers.forEach(function (l, li) {
      var ctx = l.ctx;
      ctx.clearRect(0, 0, SIZE, SIZE);
      var spot = l.spot, mx = l.mx, my = l.my;
      for (var i = 0; i < n; i++) {
        var o = i * 5;
        var x = dots[o], y = dots[o + 1];
        var a = BASE_ALPHA, g = 0;
        if (t >= 0) {
          // 1) slow diagonal wave (offset per layer so the two fields don't pulse in sync)
          var w = Math.sin(x * 0.011 + y * 0.007 - t * 0.55 + li * 2.1);
          a += 0.07 * Math.max(0, w) * Math.max(0, w);
          // 2) twinkle
          var s = Math.sin(t * dots[o + 3] + dots[o + 2]);
          if (s > 0) a += dots[o + 4] * s * s * s;
          // 3) cursor spotlight
          if (spot > 0.001) {
            var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
            if (d2 < SPOT_R * SPOT_R) {
              var k = 1 - Math.sqrt(d2) / SPOT_R;
              g = k * k * spot;
              a += 0.55 * g;
            }
          }
        }
        if (a > 1) a = 1;
        ctx.globalAlpha = a;
        ctx.fillStyle = g > 0.02
          ? "rgb(" + Math.round(255 + (GLOW[0] - 255) * g) + "," + Math.round(255 + (GLOW[1] - 255) * g) + "," + Math.round(255 + (GLOW[2] - 255) * g) + ")"
          : "#fff";
        ctx.beginPath();
        ctx.arc(x, y, DOT_R * (1 + 0.35 * g), 0, 6.2832);
        ctx.fill();
      }
    });
  }

  /* ---------------- pointer → pattern coordinates ---------------- */
  var pointer = null;
  function toLocal(l) {
    var r = l.canvas.getBoundingClientRect();
    if (!r.width) return;
    var flipped = new DOMMatrixReadOnly(getComputedStyle(l.canvas).transform === "none" ? undefined : getComputedStyle(l.canvas).transform).a < 0;
    var sx = SIZE / r.width, sy = SIZE / r.height;
    var lx = (pointer.x - r.left) * sx, ly = (pointer.y - r.top) * sy;
    l.mx = flipped ? SIZE - lx : lx;  // the top-left field is rotated 180°
    l.my = flipped ? SIZE - ly : ly;
  }

  /* ---------------- loop ---------------- */
  var visible = false, raf = 0, t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!visible || reduce.matches) return;
    layers.forEach(function (l) {
      if (pointer) toLocal(l);
      l.spot += ((pointer ? 1 : 0) - l.spot) * 0.08;   // fade the spotlight in/out
    });
    draw((now - t0) / 1000);
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (reduce.matches) { draw(-1); return; }          // static dots
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      start();
    }).observe(section);
  } else { visible = true; }

  section.addEventListener("pointermove", function (e) {
    if (!finePointer.matches || (e.pointerType && e.pointerType !== "mouse")) return;
    pointer = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  section.addEventListener("pointerleave", function () { pointer = null; });
  if (reduce.addEventListener) reduce.addEventListener("change", start);
  window.addEventListener("resize", function () { sizeCanvases(); if (!raf) draw(reduce.matches ? -1 : (performance.now() - t0) / 1000); });

  /* ---------------- load dot positions from the SVG ---------------- */
  sizeCanvases();
  fetch(imgs[0].currentSrc || imgs[0].src)
    .then(function (r) { return r.text(); })
    .then(function (svg) {
      // each dot is a circle path starting at its leftmost point: "M{cx - r} {cy}C…"
      var re = /<path d="M([\d.]+) ([\d.]+)C/g, m, pts = [];
      while ((m = re.exec(svg))) pts.push(parseFloat(m[1]) + DOT_R, parseFloat(m[2]));
      if (!pts.length) throw new Error("no dots");
      var n = pts.length / 2, seed = 7;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      dots = new Float32Array(n * 5);
      for (var i = 0; i < n; i++) {
        var o = i * 5;
        dots[o] = pts[i * 2];
        dots[o + 1] = pts[i * 2 + 1];
        dots[o + 2] = rnd() * Math.PI * 2;             // phase
        dots[o + 3] = 0.5 + rnd() * 1.1;               // speed (rad/s)
        dots[o + 4] = rnd() < 0.25 ? 0.18 + rnd() * 0.22 : 0.03; // sparkle strength
      }
      draw(reduce.matches ? -1 : 0);
      start();
    })
    .catch(function () {
      // fall back to the original images
      layers.forEach(function (l) {
        l.img.className = l.canvas.className;
        l.img.style.display = "";
        l.canvas.remove();
      });
    });
}
