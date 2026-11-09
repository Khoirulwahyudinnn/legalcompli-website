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
 * Usage in HTML:
 *   <div class="fx" data-dither='{"levels":3}'><img src="..."></div>
 *   Options: levels, mono (bool), contrast, brightness (0–200, 100 = neutral),
 *            crop [left%, top%, width%, height%] (image box relative to the layer,
 *            otherwise the image is drawn object-fit: cover).
 *
 * Add data-dither-keep to keep the original <img> under the canvas (testimonial portraits
 * use this to crossfade to color on hover).
 *
 * The <img> stays as a fallback: if the canvas can't read pixels (for example
 * when the page is opened straight from disk via file://), the plain image shows.
 */
(function () {
  "use strict";

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

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function ditherPixels(img, W, H, o) {
    var levels = o.levels || 3;
    var L = levels - 1;
    var contrast = o.contrast == null ? 1 : o.contrast;
    var bright = ((o.brightness == null ? 100 : o.brightness) - 100) / 200;
    var mono = !!o.mono;
    var mc = o.monoColor || [1, 1, 1];
    var d = img.data;

    for (var y = 0; y < H; y++) {
      var trow = (y % TILE_N) * TILE_N;
      for (var x = 0; x < W; x++) {
        var i = (y * W + x) * 4;
        if (d[i + 3] === 0) continue;
        var off = (TILE[trow + (x % TILE_N)] - 0.5) / L;
        var r = clamp01((d[i] / 255 - 0.5) * contrast + 0.5 + bright);
        var g = clamp01((d[i + 1] / 255 - 0.5) * contrast + 0.5 + bright);
        var b = clamp01((d[i + 2] / 255 - 0.5) * contrast + 0.5 + bright);
        if (mono) {
          var l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          var q = clamp01(Math.round((l + off) * L) / L);
          d[i] = mc[0] * q * 255;
          d[i + 1] = mc[1] * q * 255;
          d[i + 2] = mc[2] * q * 255;
        } else {
          d[i] = clamp01(Math.round((r + off) * L) / L) * 255;
          d[i + 1] = clamp01(Math.round((g + off) * L) / L) * 255;
          d[i + 2] = clamp01(Math.round((b + off) * L) / L) * 255;
        }
      }
    }
    return img;
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

  var cache = new Map(); // identical layers (same image, size, params) render once

  function render(layer) {
    var images = Array.prototype.slice.call(layer.querySelectorAll("img"));
    if (!images.length) return;
    var opts = {};
    try { opts = JSON.parse(layer.getAttribute("data-dither") || "{}"); } catch (e) {}

    var W = Math.round(layer.offsetWidth);
    var H = Math.round(layer.offsetHeight);
    if (!W || !H) return;

    var key = [images.map(function (im) { return (im.currentSrc || im.src) + "@" + (im.getAttribute("data-crop") || ""); }).join("+"), W, H, JSON.stringify(opts)].join("|");
    var source = cache.get(key);

    if (!source) {
      source = document.createElement("canvas");
      source.width = W;
      source.height = H;
      var sctx = source.getContext("2d", { willReadFrequently: true });
      images.forEach(function (im) { drawSource(sctx, im, W, H, cropFor(im, opts, images.length === 1)); });
      var pixels;
      try {
        pixels = sctx.getImageData(0, 0, W, H);
      } catch (err) {
        // Tainted canvas (e.g. file://). Keep the plain image.
        layer.dataset.ditherFallback = "true";
        return;
      }
      sctx.putImageData(ditherPixels(pixels, W, H, opts), 0, 0);
      cache.set(key, source);
    }

    var canvas = layer.querySelector("canvas") || document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    canvas.setAttribute("aria-hidden", "true");
    canvas.getContext("2d").drawImage(source, 0, 0);
    if (!canvas.parentNode) layer.appendChild(canvas);
    // data-dither-keep: the original image stays underneath (e.g. for a hover reveal);
    // otherwise the dithered canvas replaces it.
    if (layer.hasAttribute("data-dither-keep")) layer.classList.add("is-dithered");
    else images.forEach(function (im) { im.style.display = "none"; });
  }

  function whenLoaded(img) {
    if (img.complete && img.naturalWidth) return Promise.resolve();
    return new Promise(function (res) {
      img.addEventListener("load", res, { once: true });
      img.addEventListener("error", res, { once: true });
    });
  }

  function init() {
    var layers = Array.prototype.slice.call(document.querySelectorAll("[data-dither]"));
    // Render lazily as layers approach the viewport.
    var io = "IntersectionObserver" in window
      ? new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.unobserve(e.target);
            var imgs = Array.prototype.slice.call(e.target.querySelectorAll("img"));
            Promise.all(imgs.map(whenLoaded)).then(function () { render(e.target); });
          });
        }, { rootMargin: "400px 0px" })
      : null;

    layers.forEach(function (layer) {
      if (io) io.observe(layer);
      else Promise.all(Array.prototype.slice.call(layer.querySelectorAll("img")).map(whenLoaded)).then(function () { render(layer); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
