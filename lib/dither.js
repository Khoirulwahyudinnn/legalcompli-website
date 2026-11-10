/*
 * Dither effect — CPU port of the Figma "Dither" shader (v2, ordered family)
 * used in the design (Bayer 16x16, pixelSize 1, brightness 100, contrast 1).
 *
 * Same math as the WebGPU compute shader exported by Figma:
 *   load    → sample the source at each output pixel (pixelSize = 1)
 *   dither  → c = (c - 0.5) * contrast + 0.5 + bright
 *             q = clamp(round((c + (t - 0.5)/L) * L) / L), L = levels - 1
 *             mono: q = monoColor * quantize(luma(c))
 *   present → write back, alpha preserved
 *
 * Animated noise (retro "dithering effect"): every frame the Bayer threshold tile is
 * shifted to a pseudo-random offset, so the dither dots shimmer like animated noise.
 * 12 fps, loops every 4 s (48 frames). Only layers in the viewport animate, and only the
 * part of each layer that is actually visible (its clipping parent) is recomputed.
 * prefers-reduced-motion → static dither (frame 0), no animation.
 *
 * Usage in HTML:
 *   <div class="fx" data-dither='{"levels":3}'><img src="..."></div>
 *   Options: levels, mono (bool), contrast, brightness (0–200, 100 = neutral),
 *            crop [left%, top%, width%, height%] (image box relative to the layer,
 *            otherwise the image is drawn object-fit: cover),
 *            animate (bool, default true).
 *
 * Add data-dither-keep to keep the original <img> under the canvas (testimonial portraits
 * use this to crossfade to color on hover).
 *
 * The <img> stays as a fallback: if the canvas can't read pixels (for example
 * when the page is opened straight from disk via file://), the plain image shows.
 */
export function initDither() {
  var FPS = 12;
  var LOOP_FRAMES = 48; // 4 s at 12 fps

  // ---- Bayer matrix: identical construction to the shader's bayerMatrix() ----
  function bayerMatrix(N) {
    if (N === 1) return [[0]];
    var small = bayerMatrix(N / 2);
    var m = N / 2;
    var out = [];
    for (var y = 0; y < N; y++) {
      out[y] = new Array(N);
      for (var x = 0; x < N; x++) {
        var v = small[y % m][x % m] * 4;
        var qx = Math.floor(x / m), qy = Math.floor(y / m);
        var qoff = qy === 0 && qx === 0 ? 0 : qy === 0 && qx === 1 ? 2 : qy === 1 && qx === 0 ? 3 : 1;
        out[y][x] = v + qoff;
      }
    }
    return out;
  }
  var TILE_N = 16;
  var TILE = (function () {
    var m = bayerMatrix(TILE_N);
    var data = new Float32Array(TILE_N * TILE_N);
    for (var y = 0; y < TILE_N; y++)
      for (var x = 0; x < TILE_N; x++) data[y * TILE_N + x] = (m[y][x] + 0.5) / (TILE_N * TILE_N);
    return data;
  })();

  // Per-frame tile offsets: a fixed pseudo-random sequence (frame 0 = no shift = the static look)
  var OFFSETS = (function () {
    var out = [[0, 0]], s = 1337;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 1; i < LOOP_FRAMES; i++) out.push([Math.floor(rnd() * TILE_N), Math.floor(rnd() * TILE_N)]);
    return out;
  })();

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // Dither the region (rx, ry, rw, rh) of src (a full W-wide RGBA buffer) into out (rw × rh).
  // The threshold tile is sampled at layer coordinates + (ox, oy) so regions line up seamlessly.
  function ditherRegion(src, W, rx, ry, rw, rh, out, o, ox, oy) {
    var levels = o.levels || 3;
    var L = levels - 1;
    var contrast = o.contrast == null ? 1 : o.contrast;
    var bright = ((o.brightness == null ? 100 : o.brightness) - 100) / 200;
    var mono = !!o.mono;
    var mc = o.monoColor || [1, 1, 1];

    for (var y = 0; y < rh; y++) {
      var ly = ry + y;
      var trow = ((ly + oy) & 15) * TILE_N;
      var si = (ly * W + rx) * 4;
      var di = y * rw * 4;
      for (var x = 0; x < rw; x++, si += 4, di += 4) {
        var a = src[si + 3];
        out[di + 3] = a;
        if (a === 0) continue;
        var off = (TILE[trow + ((rx + x + ox) & 15)] - 0.5) / L;
        var r = clamp01((src[si] / 255 - 0.5) * contrast + 0.5 + bright);
        var g = clamp01((src[si + 1] / 255 - 0.5) * contrast + 0.5 + bright);
        var b = clamp01((src[si + 2] / 255 - 0.5) * contrast + 0.5 + bright);
        if (mono) {
          var l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          var q = clamp01(Math.round((l + off) * L) / L) * 255;
          out[di] = mc[0] * q;
          out[di + 1] = mc[1] * q;
          out[di + 2] = mc[2] * q;
        } else {
          out[di] = clamp01(Math.round((r + off) * L) / L) * 255;
          out[di + 1] = clamp01(Math.round((g + off) * L) / L) * 255;
          out[di + 2] = clamp01(Math.round((b + off) * L) / L) * 255;
        }
      }
    }
  }

  // A layer may stack several <img>s (drawn in DOM order). Each can set data-crop:
  // "cover" (object-fit: cover) or a JSON [left%, top%, width%, height%] box.
  function cropFor(img, opts, single) {
    var c = img.getAttribute("data-crop");
    if (c === "cover") return null;
    if (c) { try { return JSON.parse(c); } catch (e) { return null; } }
    return single ? opts.crop : null;
  }

  function drawSource(ctx, image, W, H, crop) {
    if (crop) {
      ctx.drawImage(image, (crop[0] / 100) * W, (crop[1] / 100) * H, (crop[2] / 100) * W, (crop[3] / 100) * H);
      return;
    }
    // object-fit: cover, centered
    var iw = image.naturalWidth, ih = image.naturalHeight;
    var s = Math.max(W / iw, H / ih);
    var dw = iw * s, dh = ih * s;
    ctx.drawImage(image, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  var sources = new Map(); // identical layers (same image, size, params) share one source buffer
  var states = new Map();  // layer element → render state

  // The part of the layer that can actually be seen: its box clipped by the nearest
  // overflow-clipping ancestor (e.g. a 996×664 gradient shown as a 32px card strip).
  function visibleRegion(layer, W, H) {
    var lr = layer.getBoundingClientRect();
    if (!lr.width || !lr.height) return { x: 0, y: 0, w: W, h: H };
    var clip = null;
    for (var el = layer.parentElement; el && el !== document.body; el = el.parentElement) {
      var cs = getComputedStyle(el);
      if (cs.overflow !== "visible" || cs.overflowX !== "visible" || cs.overflowY !== "visible") { clip = el.getBoundingClientRect(); break; }
    }
    if (!clip) return { x: 0, y: 0, w: W, h: H };
    var sx = W / lr.width, sy = H / lr.height, PAD = 6; // pad covers small tilts / hover shifts
    var x0 = Math.max(0, Math.floor((clip.left - lr.left - PAD) * sx));
    var y0 = Math.max(0, Math.floor((clip.top - lr.top - PAD) * sy));
    var x1 = Math.min(W, Math.ceil((clip.right - lr.left + PAD) * sx));
    var y1 = Math.min(H, Math.ceil((clip.bottom - lr.top + PAD) * sy));
    if (x1 <= x0 || y1 <= y0) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function render(layer) {
    var images = Array.prototype.slice.call(layer.querySelectorAll("img"));
    if (!images.length) return;
    var opts = {};
    try { opts = JSON.parse(layer.getAttribute("data-dither") || "{}"); } catch (e) {}

    var W = Math.round(layer.offsetWidth);
    var H = Math.round(layer.offsetHeight);
    if (!W || !H) return;

    var key = [images.map(function (im) { return (im.currentSrc || im.src) + "@" + (im.getAttribute("data-crop") || ""); }).join("+"), W, H, JSON.stringify(opts)].join("|");
    var src = sources.get(key);

    if (!src) {
      var sc = document.createElement("canvas");
      sc.width = W;
      sc.height = H;
      var sctx = sc.getContext("2d", { willReadFrequently: true });
      images.forEach(function (im) { drawSource(sctx, im, W, H, cropFor(im, opts, images.length === 1)); });
      try {
        src = sctx.getImageData(0, 0, W, H).data;
      } catch (err) {
        // Tainted canvas (e.g. file://). Keep the plain image.
        layer.dataset.ditherFallback = "true";
        return;
      }
      sources.set(key, src);
    }

    var canvas = layer.querySelector("canvas") || document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.setAttribute("aria-hidden", "true");
    var ctx = canvas.getContext("2d");

    // full static frame (frame 0)
    var full = ctx.createImageData(W, H);
    ditherRegion(src, W, 0, 0, W, H, full.data, opts, 0, 0);
    ctx.putImageData(full, 0, 0);

    if (!canvas.parentNode) layer.appendChild(canvas);
    // data-dither-keep: the original image stays underneath (e.g. for a hover reveal);
    // otherwise the dithered canvas replaces it.
    if (layer.hasAttribute("data-dither-keep")) layer.classList.add("is-dithered");
    else images.forEach(function (im) { im.style.display = "none"; });

    states.set(layer, { key: key, src: src, W: W, H: H, opts: opts, ctx: ctx, region: null, frame: 0 });
  }

  function whenLoaded(img) {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(function (res) {
      img.addEventListener("load", res, { once: true });
      img.addEventListener("error", res, { once: true });
    });
  }

  /* ---------------- animation loop ---------------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var active = new Set(); // layers currently in the viewport
  var raf = 0, lastFrameAt = 0, frameNo = 0;

  function tick(now) {
    raf = 0;
    if (!active.size || reduceMotion.matches) return;
    raf = requestAnimationFrame(tick);
    if (now - lastFrameAt < 1000 / FPS) return;
    lastFrameAt = now;
    frameNo = (frameNo + 1) % LOOP_FRAMES;
    var off = OFFSETS[frameNo];
    var shared = new Map(); // identical layers + region → one computation per frame

    active.forEach(function (layer) {
      var s = states.get(layer);
      if (!s || s.opts.animate === false) return;
      if (!s.region) s.region = visibleRegion(layer, s.W, s.H);
      var r = s.region;
      if (!r.w || !r.h) return;
      var k = s.key + "#" + r.x + "," + r.y + "," + r.w + "," + r.h;
      var img = shared.get(k);
      if (!img) {
        img = s.ctx.createImageData(r.w, r.h);
        ditherRegion(s.src, s.W, r.x, r.y, r.w, r.h, img.data, s.opts, off[0], off[1]);
        shared.set(k, img);
      }
      s.ctx.putImageData(img, r.x, r.y);
    });
  }

  function start() { if (!raf && active.size && !reduceMotion.matches) raf = requestAnimationFrame(tick); }

  var visIO = "IntersectionObserver" in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) active.add(e.target); else active.delete(e.target);
        });
        start();
      })
    : null;

  // layout changes (resize, breakpoints) → visible regions must be measured again
  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { states.forEach(function (s) { s.region = null; }); }, 150);
  });
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", start);

  function init() {
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-dither]"));
    // Render lazily as layers approach the viewport.
    var io = "IntersectionObserver" in window
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            var imgs = Array.prototype.slice.call(e.target.querySelectorAll("img"));
            Promise.all(imgs.map(whenLoaded)).then(function () {
              render(e.target);
              if (visIO) visIO.observe(e.target); // start animating once rendered
            });
          });
        }, { rootMargin: "400px 0px" })
      : null;

    layers.forEach(function (layer) {
      if (io) io.observe(layer);
      else Promise.all(Array.prototype.slice.call(layer.querySelectorAll("img")).map(whenLoaded)).then(function () { render(layer); });
    });
  }

  init();
}
