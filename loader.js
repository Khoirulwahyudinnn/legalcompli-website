/*
 * Intro loader — 0→100% counter, then an ordered-dither dissolve into the page.
 *
 * - Progress follows real loading (page images + web fonts), eased so it never jumps
 *   backwards and takes at least MIN_TIME, so the counter always reads naturally.
 * - Background is drawn on a low-res canvas with the same Bayer 16×16 matrix the site's
 *   dither effect uses: a warm glow builds up in dithered steps as loading progresses.
 * - Exit: the text fades up, then every canvas cell disappears when its Bayer threshold
 *   drops below the dissolve progress → the page is revealed through a dither pattern.
 * - Exposes window.LegalLoader.onDone(fn) so the hero intro can start right after.
 * - prefers-reduced-motion: fast counter, plain fade, no dissolve.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var el = document.getElementById("loader");
  var doneCallbacks = [];
  var finished = false;

  window.LegalLoader = {
    onDone: function (fn) { if (finished) fn(); else doneCallbacks.push(fn); }
  };

  function finish() {
    if (finished) return;
    finished = true;
    root.classList.remove("is-loading");
    if (el && el.parentNode) el.parentNode.removeChild(el);
    doneCallbacks.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} });
  }

  if (!el) { finish(); return; }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var MIN_TIME = reduce ? 400 : 2200;   // ms before the counter may reach 100
  var DISSOLVE = 1100;                  // ms for the dither dissolve
  var CELL = 5;                         // px per dither cell (visible, like the site's dither)

  // keep the page at the top while the loader is up
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  var counterEl = el.querySelector("[data-loader-count]");
  var barEl = el.querySelector("[data-loader-bar]");
  var canvas = el.querySelector("canvas");
  var ctx = canvas.getContext("2d");

  /* ---------- Bayer 16×16 (same construction as dither.js) ---------- */
  function bayer(N) {
    if (N === 1) return [[0]];
    var s = bayer(N / 2), m = N / 2, out = [];
    for (var y = 0; y < N; y++) {
      out[y] = [];
      for (var x = 0; x < N; x++) {
        var qx = Math.floor(x / m), qy = Math.floor(y / m);
        out[y][x] = s[y % m][x % m] * 4 + (qy === 0 && qx === 0 ? 0 : qy === 0 && qx === 1 ? 2 : qy === 1 && qx === 0 ? 3 : 1);
      }
    }
    return out;
  }
  var B = bayer(16);
  function th(x, y) { return (B[y & 15][x & 15] + 0.5) / 256; }

  /* ---------- palette (site tokens) ---------- */
  var COCOA = [50, 34, 34];      // #322222
  var EMBER = [120, 52, 40];     // dithered mid step
  var GLOW = [254, 133, 0];      // #fe8500 (orange-strong)

  var W = 0, H = 0, img = null;
  function resize() {
    W = Math.max(1, Math.ceil(window.innerWidth / CELL));
    H = Math.max(1, Math.ceil(window.innerHeight / CELL));
    canvas.width = W;
    canvas.height = H;
    img = ctx.createImageData(W, H);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- real loading progress ---------- */
  var tasks = [];
  Array.prototype.forEach.call(document.images, function (im) {
    if (im.closest("#loader")) return;
    tasks.push(im.complete ? Promise.resolve() : new Promise(function (r) {
      im.addEventListener("load", r, { once: true });
      im.addEventListener("error", r, { once: true });
    }));
  });
  if (document.fonts && document.fonts.ready) tasks.push(document.fonts.ready);
  tasks.push(new Promise(function (r) { if (document.readyState === "complete") r(); else window.addEventListener("load", r, { once: true }); }));
  var total = tasks.length, settled = 0;
  tasks.forEach(function (p) { p.then(function () { settled++; }, function () { settled++; }); });
  // never hang on a slow asset: count everything as loaded after 8s
  var hardStop = setTimeout(function () { settled = total; }, 8000);

  var start = performance.now();
  var shown = 0;        // displayed progress 0..1
  var phase = "load";   // load → exit
  var exitStart = 0;

  function draw(progress, dissolve) {
    var d = img.data;
    // glow centre near the counter (bottom-left), radius grows with progress
    var cx = W * 0.18, cy = H * 0.92;
    var radius = Math.max(W, H) * (0.25 + progress * 0.95);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = (y * W + x) * 4;
        var t = th(x, y);
        if (dissolve > 0 && t < dissolve) { d[i + 3] = 0; continue; }   // dissolved cell
        var dx = x - cx, dy = (y - cy) * 1.25;
        var g = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / radius);  // 0..1 glow
        g = g * g * (0.35 + 0.65 * progress);
        // ordered dither between three levels: cocoa → ember → glow
        var lv = g * 2 + (t - 0.5);
        var c = lv < 0.5 ? COCOA : lv < 1.5 ? EMBER : GLOW;
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function frame(now) {
    if (phase === "load") {
      var real = total ? settled / total : 1;
      var timeCap = Math.min(1, (now - start) / MIN_TIME);
      var target = Math.min(real, timeCap);
      shown += (target - shown) * 0.08;                 // smooth, never jumps
      if (target >= 1 && shown > 0.995) shown = 1;
      var pct = Math.round(shown * 100);
      counterEl.textContent = pct;
      barEl.style.transform = "scaleX(" + shown.toFixed(4) + ")";
      draw(shown, 0);
      if (shown >= 1) {
        clearTimeout(hardStop);
        phase = "exit";
        exitStart = now + (reduce ? 0 : 250);          // brief hold on 100
        el.classList.add("is-exiting");                // text fades up (CSS)
      }
      requestAnimationFrame(frame);
      return;
    }

    // exit
    if (reduce) { el.classList.add("is-fading"); setTimeout(finish, 300); return; }
    var p = Math.max(0, (now - exitStart) / DISSOLVE);
    if (p > 0 && !root.classList.contains("is-revealing")) {
      root.classList.add("is-revealing");
      root.classList.remove("is-loading");             // page can scroll again
      doneCallbacks.splice(0).forEach(function (fn) { try { fn(); } catch (e) {} }); // hero intro plays under the dissolve
    }
    if (p >= 1) { root.classList.remove("is-revealing"); finish(); return; }
    draw(1, ease(p) * 1.002);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
