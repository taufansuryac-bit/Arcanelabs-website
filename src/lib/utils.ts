import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasSeenLoader() {
  if (typeof window === "undefined") return false;

  try {
    return sessionStorage.getItem("arcane-loader-seen") === "1";
  } catch {
    return false;
  }
}
