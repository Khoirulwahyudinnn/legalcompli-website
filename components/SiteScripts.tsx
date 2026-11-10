"use client";

import { useEffect } from "react";
import { initLoader } from "@/lib/loader";
import { initDither } from "@/lib/dither";
import { initAboutDots } from "@/lib/aboutDots";
import { initMain } from "@/lib/main";

// The page's behaviour (intro loader, dither canvases, GSAP animations, nav, FAQ) is
// imperative DOM code; run it once after hydration. The guard keeps React Strict Mode's
// double effect in development from wiring everything twice.
let started = false;

export default function SiteScripts() {
  useEffect(() => {
    if (started) return;
    started = true;
    initLoader(); // first: exposes window.LegalLoader for the hero intro
    initDither();
    initAboutDots(); // before initMain: its scroll drift targets the dot canvases
    initMain();
  }, []);
  return null;
}
