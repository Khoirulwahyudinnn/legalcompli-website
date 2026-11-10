import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";

export function initMain() {
  var hasGsap = true;
  var smoother = null; // GSAP ScrollSmoother instance (desktop pointers only)

  // Scroll to a y position or element, through ScrollSmoother when it's running
  function scrollToTarget(target, offset) {
    if (smoother) {
      smoother.scrollTo(target, true, typeof target === "number" ? undefined : "top " + (offset || 0) + "px");
      return;
    }
    var top = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY - (offset || 0);
    window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Header: shadow on scroll + hide on scroll down / show on scroll up ---------------- */
  var header = document.querySelector(".site-header");
  var lastY = window.scrollY;
  var HIDE_AFTER = 58;    // navbar height: always visible at the very top
  var DELTA = 6;          // ignore tiny jitters (5–10px)
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    var menuOpen = document.getElementById("site-nav") && document.getElementById("site-nav").classList.contains("is-open");
    if (y <= HIDE_AFTER || menuOpen || header.contains(document.activeElement)) {
      header.classList.remove("is-hidden");
    } else if (y > lastY + DELTA) {
      header.classList.add("is-hidden");      // scrolling down
    } else if (y < lastY - DELTA) {
      header.classList.remove("is-hidden");   // scrolling up
    }
    if (Math.abs(y - lastY) > DELTA) lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  // keyboard users tabbing into the nav always get it back
  header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });
  onScroll();

  /* ---------------- Mobile nav ---------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  function setNav(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
  }
  toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setNav(false); });

  /* ---------------- FAQ accordion (one open at a time) ---------------- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".acc-item"));

  function openItem(item, open) {
    var btn = item.querySelector(".acc-trigger");
    var panel = item.querySelector(".acc-panel");
    btn.setAttribute("aria-expanded", String(open));
    item.classList.toggle("is-open", open);

    if (!hasGsap || reduceMotion) { panel.hidden = !open; return; }

    gsap.killTweensOf(panel);
    panel.classList.add("is-animating");
    var done = function () { panel.classList.remove("is-animating"); };
    if (open) {
      panel.hidden = false;
      // same duration + ease as closing: one grows exactly as the other shrinks (constant total height)
      gsap.fromTo(panel, { height: 0, opacity: 0 }, {
        height: "auto", opacity: 1, duration: 0.4, ease: "power2.inOut",
        clearProps: "height,opacity", onComplete: done
      });
    } else {
      gsap.to(panel, {
        height: 0, opacity: 0, duration: 0.4, ease: "power2.inOut",
        onComplete: function () { panel.hidden = true; gsap.set(panel, { clearProps: "height,opacity" }); done(); }
      });
    }
  }

  items.forEach(function (item) {
    item.querySelector(".acc-trigger").addEventListener("click", function () {
      // exactly one question is always open, so the FAQ keeps the same fixed height
      if (item.classList.contains("is-open")) return;
      items.forEach(function (other) { if (other !== item && other.classList.contains("is-open")) openItem(other, false); });
      openItem(item, true);
    });
  });

  /* ---------------- Smooth in-page anchors ---------------- */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute("href").length < 2) return;
    var target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (target.id === "top") scrollToTarget(0); else scrollToTarget(target, 56);
    if (history.pushState) history.pushState(null, "", a.getAttribute("href"));
  });

  /* ---------------- How It Works: subtle cursor-follow ----------------
     Each step card leans a little toward the cursor (≤2° tilt) and drifts toward it (≤5px);
     its chip row drifts slightly further for a hint of depth. Values ease with a frame-rate
     independent lerp in a requestAnimationFrame loop that only runs while something is moving.
     Mouse/trackpad only; off for touch and prefers-reduced-motion. */
  (function cursorFollow() {
    var section = document.querySelector(".how");
    if (!section) return;
    var cards = Array.prototype.slice.call(section.querySelectorAll(".step"));
    if (!cards.length) return;

    var MAX_TILT = 2;        // degrees
    var MAX_SHIFT = 5;       // px, card
    var MAX_SHIFT_CHIPS = 3; // px, extra for the chip row
    var EASE = 0.1;          // lerp per 60fps frame

    var query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    var state = cards.map(function (card) {
      return { card: card, chips: card.querySelector(".chips"), cur: { x: 0, y: 0, rx: 0, ry: 0, cx: 0, cy: 0 }, tgt: { x: 0, y: 0, rx: 0, ry: 0, cx: 0, cy: 0 } };
    });
    var pointer = null, raf = 0, last = 0, enabled = false;

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    function computeTargets() {
      state.forEach(function (s) {
        var t = s.tgt;
        if (!pointer) { t.x = t.y = t.rx = t.ry = t.cx = t.cy = 0; return; }
        var r = s.card.getBoundingClientRect();
        var nx = (pointer.x - (r.left + r.width / 2)) / (r.width / 2);   // -1..1 inside the card
        var ny = (pointer.y - (r.top + r.height / 2)) / (r.height / 2);
        var dist = Math.max(Math.abs(nx), Math.abs(ny));
        // full response on the hovered card, a gentle falloff for its neighbours
        var influence = dist <= 1 ? 1 : Math.max(0, 1 - (dist - 1) * 0.9) * 0.45;
        nx = clamp(nx, -1, 1); ny = clamp(ny, -1, 1);
        t.x = nx * MAX_SHIFT * influence;
        t.y = ny * MAX_SHIFT * influence;
        t.rx = -ny * MAX_TILT * influence;   // tilt top away when cursor is low, etc.
        t.ry = nx * MAX_TILT * influence;
        t.cx = nx * MAX_SHIFT_CHIPS * influence;
        t.cy = ny * MAX_SHIFT_CHIPS * influence;
      });
    }

    function apply(s) {
      var c = s.cur;
      s.card.style.translate = c.x.toFixed(2) + "px " + c.y.toFixed(2) + "px";
      var mag = Math.sqrt(c.rx * c.rx + c.ry * c.ry);
      var angle = Math.min(MAX_TILT, mag);   // combined tilt never exceeds 2°, even at the corners
      s.card.style.rotate = mag < 0.01 ? "none" : (c.rx / mag).toFixed(4) + " " + (c.ry / mag).toFixed(4) + " 0 " + angle.toFixed(3) + "deg";
      if (s.chips) s.chips.style.translate = c.cx.toFixed(2) + "px " + c.cy.toFixed(2) + "px";
    }

    function frame(now) {
      var dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      var k = 1 - Math.pow(1 - EASE, dt / 16.7);
      var moving = false;
      if (pointer) computeTargets();
      state.forEach(function (s) {
        ["x", "y", "rx", "ry", "cx", "cy"].forEach(function (key) {
          var d = s.tgt[key] - s.cur[key];
          if (Math.abs(d) > 0.005) { s.cur[key] += d * k; moving = true; } else s.cur[key] = s.tgt[key];
        });
        apply(s);
      });
      if (moving || pointer) raf = requestAnimationFrame(frame);
      else { raf = 0; last = 0; section.classList.remove("is-tracking"); }
    }

    function start() { if (!raf) { section.classList.add("is-tracking"); raf = requestAnimationFrame(frame); } }

    function onMove(e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      pointer = { x: e.clientX, y: e.clientY };
      start();
    }
    function onLeave() {
      pointer = null;
      computeTargets();     // all targets → 0; the loop eases everything home, then stops
      start();
    }

    function enable() {
      if (enabled) return;
      enabled = true;
      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
    }
    function disable() {
      if (!enabled) return;
      enabled = false;
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
      raf = 0; last = 0; pointer = null;
      section.classList.remove("is-tracking");
      state.forEach(function (s) {
        ["x", "y", "rx", "ry", "cx", "cy"].forEach(function (key) { s.cur[key] = s.tgt[key] = 0; });
        s.card.style.translate = ""; s.card.style.rotate = "";
        if (s.chips) s.chips.style.translate = "";
      });
    }

    function sync() { if (query.matches) enable(); else disable(); }
    sync();
    if (query.addEventListener) query.addEventListener("change", sync); else query.addListener(sync);
    window.addEventListener("pagehide", function (e) { if (!e.persisted) disable(); });
  })();

  /* ---------------- Count-up stats ---------------- */
  function formatCount(el, value) {
    return (el.dataset.prefix || "") + Math.round(value) + (el.dataset.suffix || "");
  }

  if (!hasGsap) return;

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  var mm = gsap.matchMedia();

  /* ---------------- GSAP smooth scroll (ScrollSmoother) ----------------
     Mouse/trackpad devices only; touch screens keep their native momentum scrolling and
     "reduce motion" users get plain scrolling. Created before every other ScrollTrigger. */
  mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", function () {
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.5,          // seconds to catch up with the native scroll position
      smoothTouch: false,
      effects: false,
      normalizeScroll: false
    });
    document.documentElement.classList.add("has-smoother");
    ScrollTrigger.refresh();
    return function () {
      smoother.kill();
      smoother = null;
      document.documentElement.classList.remove("has-smoother");
    };
  });

  mm.add({ motion: "(prefers-reduced-motion: no-preference)" }, function () {
    var ease = "power3.out";

    // Hero intro — held (start state applied) until the loader starts dissolving
    var intro = gsap.timeline({ paused: true });
    intro.fromTo(".hero [data-reveal]",
      { y: 28, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.9, ease: ease, stagger: 0.09, clearProps: "transform" }, 0.1);
    intro.from(".profile-card", { y: 60, autoAlpha: 0, duration: 1.1, ease: ease }, 0.35);
    // clear the inline transform afterwards so the navbar's auto-hide transform (CSS) takes over
    intro.from(".site-header", { y: -16, autoAlpha: 0, duration: 0.7, ease: ease, clearProps: "transform" }, 0);
    if (window.LegalLoader) window.LegalLoader.onDone(function () { intro.play(); });
    else intro.play();

    // Hero landscape: slow parallax drift
    gsap.fromTo(".hero__landscape", { y: -40 }, {
      y: 40,                  // ±40px stays inside the photo's 140px / 90px overflow, so no edge shows
      ease: "none",
      scrollTrigger: { trigger: ".hero__band", start: "top bottom", end: "bottom top", scrub: true }
    });

    // Generic text reveals outside the hero
    // fromTo with an explicit y: 0 end (not from()): elements such as .t-card / .btn have a CSS
    // `transition: transform`, which makes from() read a half-transitioned value as its end point
    // and leaves cards stuck 15–45px low. clearProps hands transform back to CSS (hover lift).
    gsap.utils.toArray("main > section:not(.hero) [data-reveal]").forEach(function (el) {
      gsap.fromTo(el, { y: 24, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.8, ease: ease, clearProps: "transform",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });

    // Cards: one reveal per section. All of a section's cards are hidden up front (fromTo renders
    // its start state immediately) and stagger in together, once, when their group scrolls into view.
    // (ScrollTrigger.batch only hid each card on enter, so cards flashed visible, vanished and
    // re-entered, and multi-row grids like the testimonials came in as several separate waves.)
    gsap.utils.toArray("main > section:not(.hero)").forEach(function (section) {
      var cards = gsap.utils.toArray(section.querySelectorAll("[data-reveal-card]"));
      if (!cards.length) return;
      gsap.fromTo(cards, { y: 48, autoAlpha: 0 }, {
        y: 0, autoAlpha: 1, duration: 0.9, ease: ease, stagger: 0.1, clearProps: "transform",
        scrollTrigger: { trigger: cards[0].parentElement, start: "top 85%", once: true }
      });
    });

    // About: decorative dot fields drift slightly
    gsap.to(".about__dots--br", {
      y: -40, ease: "none",
      scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true }
    });
    gsap.to(".about__dots--tl", {
      y: 40, ease: "none",
      scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true }
    });

    // Closing landscape rises gently
    gsap.from(".closing__bg", {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".closing", start: "top bottom", end: "bottom bottom", scrub: true }
    });

    // Count-up numbers — armed only once the intro loader has revealed the page,
    // so the ones already in view (hero card) count up where the visitor can see them
    gsap.utils.toArray("[data-count]").forEach(function (el) { el.textContent = formatCount(el, 0); });
    function armCounters() {
      gsap.utils.toArray("[data-count]").forEach(function (el) {
        var target = parseFloat(el.dataset.count);
        var obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: "power2.out", delay: 0.4,
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          onUpdate: function () { el.textContent = formatCount(el, obj.v); }
        });
      });
    }
    if (window.LegalLoader) window.LegalLoader.onDone(armCounters); else armCounters();
  });


  /* ---------------- Practice Areas: progressive stacked cards ----------------
     Structure: .stack (wrapper) > .stack__cards (sticky stage) > .stack__card-wrapper > .stack-card,
     then .stack__spacer (scroll runway).

     Resting state: only card 01 is fully visible; cards 02–06 wait in the pile behind it, showing
     just their top edges (each slot back = 16px higher and slightly smaller).
     One step per card: the next card rises out from behind the active card, comes to the front and
     settles in the active position, while the previous card eases back into the pile.
     Upcoming cards never move until it's their turn; previous cards shift back one slot per step. */
  var stackEl = document.querySelector("[data-stack]");

  mm.add("(prefers-reduced-motion: no-preference) and (min-height: 640px)", function () {
    if (!stackEl) return;
    var wrappers = gsap.utils.toArray(".stack__card-wrapper", stackEl);
    var n = wrappers.length;
    if (n < 2) return;

    var stage = stackEl.querySelector(".stack__cards");
    var depth = n - 1;                         // every other card lives in the pile
    var m = { cardH: 545, stageH: 625, pinTop: 96, peek: 16, shrink: 56 / 1028, lift: 160 };

    stackEl.classList.add("stack--pinned");

    function content(w) { return w.querySelectorAll(".stack-card__bar > *, .stack-card__body"); }

    function measure() {
      var narrow = window.innerWidth <= 760;
      m.peek = narrow ? 10 : 16;
      m.shrink = narrow ? 0.035 : 56 / 1028;
      m.cardH = Math.max.apply(null, wrappers.map(function (w) { return w.offsetHeight; }));
      m.stageH = m.cardH + depth * m.peek;
      var vh = window.innerHeight;
      // centre the pile vertically in the space below the fixed header (equal gap above and below)
      var headerH = header ? header.offsetHeight : 56;
      m.pinTop = Math.max(headerH + 8, Math.round(headerH + (vh - headerH - m.stageH) / 2));
      // same rise for every card, sized so even the farthest slot (top of the pile) stays below the header
      m.lift = Math.max(40, Math.round(Math.min(m.cardH * 0.4, m.pinTop - 72)));
      stackEl.style.setProperty("--stage-h", m.stageH + "px");
      stackEl.style.setProperty("--pin-top", m.pinTop + "px");
      m.runway = Math.round((n - 1) * vh * 0.9);
    }
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    function slotY(s) { return (depth - s) * m.peek; }
    function slotScale(s) { return 1 - s * m.shrink; }
    function slotZ(s) { return 50 - s; }

    // resting state: card i sits in slot i (01 in front)
    wrappers.forEach(function (w, i) {
      gsap.set(w, { y: function () { return slotY(i); }, scale: function () { return slotScale(i); }, zIndex: i === 0 ? 100 : slotZ(i) });
      gsap.set(content(w), { opacity: i === 0 ? 1 : 0 });
    });

    // One continuous timeline: card k's transition occupies [k-1, k] of the scroll progress,
    // back to back with no holds, so every scrolled pixel moves the stack.
    var tl = gsap.timeline({ defaults: { force3D: true } });
    var stepTimes = [0];

    // slot bookkeeping while building the timeline
    var slotOf = wrappers.map(function (_, i) { return i; });

    for (var k = 1; k < n; k++) {
      var label = "card" + (k + 1);
      tl.addLabel(label);
      var emerging = wrappers[k];
      var front = wrappers[k - 1];
      var s0 = slotOf[k];                    // = k: right behind the previous cards

      // 1) rise out from behind the pile (still underneath the active card) — starts moving at once
      tl.to(emerging, {
        y: function (s) { return function () { return slotY(s) - m.lift; }; }(s0),
        scale: function (s) { return function () { return slotScale(s) + (1 - slotScale(s)) * 0.6; }; }(s0),
        duration: 0.52, ease: "sine.out"
      }, label);
      tl.to(content(emerging), { opacity: 1, duration: 0.4, ease: "none" }, label + "+=0.05");

      // 2) previous cards make room: each shifts one slot further back
      wrappers.slice(0, k - 1).forEach(function (w) {
        var to = slotOf[wrappers.indexOf(w)] + 1;
        tl.set(w, { zIndex: slotZ(to) }, label);
        tl.to(w, { y: function () { return slotY(to); }, scale: function () { return slotScale(to); }, duration: 0.7, ease: "sine.inOut" }, label + "+=0.2");
        slotOf[wrappers.indexOf(w)] = to;
      });

      // 3) halfway: the emerging card passes in front, then settles into the active position
      tl.set(emerging, { zIndex: 100 + k }, label + "+=0.5");
      tl.set(front, { zIndex: slotZ(1) }, label + "+=0.5");
      tl.to(emerging, { y: function () { return slotY(0); }, scale: 1, duration: 0.48, ease: "sine.inOut" }, label + "+=0.52");

      // 4) the previous active card eases back into slot 1 and its content fades to a clean edge
      tl.to(front, { y: function () { return slotY(1); }, scale: function () { return slotScale(1); }, duration: 0.7, ease: "sine.inOut" }, label + "+=0.3");
      tl.to(content(front), { opacity: 0, duration: 0.35, ease: "none" }, label + "+=0.4");

      slotOf[k - 1] = 1;
      slotOf[k] = 0;
      stepTimes.push(k);                     // card k+1 is fully in front at time k
    }

    function setFront(i) {
      wrappers.forEach(function (w, j) { w.classList.toggle("is-front", j === i); });
    }

    var st = ScrollTrigger.create({
      trigger: stage,
      pin: true,              // ScrollTrigger pin (CSS sticky can't work inside ScrollSmoother)
      start: function () { return "top " + m.pinTop + "px"; },
      end: function () { return "+=" + m.runway; },
      animation: tl,
      scrub: 1.2,             // eased catch-up; progress always follows the scroll position, no snapping
      onUpdate: function (self) {
        var t = self.progress * tl.duration(), idx = 0;
        stepTimes.forEach(function (time, i) { if (t >= time - 0.5) idx = i; });
        setFront(idx);
      }
    });
    setFront(0);

    // Undo everything this mode added (breakpoint change / teardown); gsap reverts the tweens
    return function () {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      st.kill();
      stackEl.classList.remove("stack--pinned");
      ["--stage-h", "--pin-top"].forEach(function (v) { stackEl.style.removeProperty(v); });
      wrappers.forEach(function (w) { w.classList.remove("is-front"); });
    };
  });

  // Tear down all ScrollTriggers/tweens when the page is unloaded (or leaves the bfcache)
  window.addEventListener("pagehide", function (e) { if (!e.persisted) mm.revert(); });

  // Re-measure after web fonts settle (layout shifts move trigger points)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
}
