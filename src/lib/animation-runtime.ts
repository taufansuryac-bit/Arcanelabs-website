/** Returns true when the OS prefers-reduced-motion media query is active. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Subscribes to OS-level motion preference changes. Returns a cleanup fn. */
export function observeReducedMotion(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = (e: MediaQueryListEvent) => onChange(e.matches);
  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}

export function shouldAnimate(pageVisible: boolean, inViewport: boolean, reducedMotion = false) {
  return pageVisible && inViewport && !reducedMotion;
}

export function isDocumentVisible() {
  return typeof document === "undefined" ? true : !document.hidden;
}

export function observeDocumentVisibility(onChange: (visible: boolean) => void) {
  if (typeof document === "undefined") return () => {};

  const handleVisibilityChange = () => {
    onChange(!document.hidden);
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
}

export function observeElementVisibility(
  element: Element,
  onChange: (visible: boolean) => void,
  options?: IntersectionObserverInit,
) {
  if (typeof IntersectionObserver === "undefined") {
    onChange(true);
    return () => {};
  }

  const observer = new IntersectionObserver((entries) => {
    const entry = entries.find((candidate) => candidate.target === element);
    if (entry) onChange(entry.isIntersecting);
  }, options);

  observer.observe(element);
  return () => observer.disconnect();
}
