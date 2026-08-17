export function shouldAnimate(pageVisible: boolean, inViewport: boolean) {
  return pageVisible && inViewport;
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
