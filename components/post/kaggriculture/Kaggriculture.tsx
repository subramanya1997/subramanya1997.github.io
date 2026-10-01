"use client";

import { useEffect } from "react";
import { initializeCohorts } from "./cohorts";
import { initializeReplay } from "./replay";
import "./article.css";

/** Start the saved-state widgets after the native post body mounts. */
export default function Kaggriculture() {
  useEffect(() => {
    let dispose: (() => void) | undefined;
    const initialize = () => {
      dispose?.();
      // Translation replaces the article body, so bind the new controls too.
      const toc = (window as Window & { tocModule?: { regenerate: () => void } }).tocModule;
      toc?.regenerate();
      const stopCohorts = initializeCohorts();
      const stopReplay = initializeReplay();
      dispose = () => { stopCohorts(); stopReplay?.(); };
    };
    initialize();
    document.addEventListener("i18n:translationLoaded", initialize);
    return () => {
      document.removeEventListener("i18n:translationLoaded", initialize);
      dispose?.();
    };
  }, []);
  return null;
}
