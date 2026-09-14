// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.
//
// Concurrency fix: in a Node.js serverless environment multiple requests can
// be in-flight simultaneously on the same V8 isolate.  A bare module-level
// `lastCapturedError` variable would let error A recorded for request 1 be
// consumed by the error-handler for request 2.  We use AsyncLocalStorage so
// each async call chain gets its own slot.

import { AsyncLocalStorage } from "node:async_hooks";

type Slot = { error: unknown; at: number } | undefined;

/** Per-request error slot.  Falls back to a simple module-level variable on
 *  runtimes that don't support AsyncLocalStorage (e.g. browser, old CF workers). */
let als: AsyncLocalStorage<{ slot: Slot }> | undefined;
try {
  als = new AsyncLocalStorage<{ slot: Slot }>();
} catch {
  // Non-Node runtimes — graceful degradation.
}

/** Module-level fallback for runtimes without AsyncLocalStorage. */
let fallbackSlot: Slot;

const TTL_MS = 5_000;

function getStore(): { slot: Slot } | undefined {
  return als?.getStore();
}

function record(error: unknown) {
  const entry = { error, at: Date.now() };
  const store = getStore();
  if (store) {
    store.slot = entry;
  } else {
    fallbackSlot = entry;
  }
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  const store = getStore();
  const captured = store ? store.slot : fallbackSlot;
  if (!captured) return undefined;
  if (Date.now() - captured.at > TTL_MS) {
    if (store) store.slot = undefined;
    else fallbackSlot = undefined;
    return undefined;
  }
  if (store) store.slot = undefined;
  else fallbackSlot = undefined;
  return captured.error;
}

/**
 * Wraps a server request handler so each invocation runs in its own
 * AsyncLocalStorage context — preventing cross-request error leakage.
 *
 * Usage in server.ts:
 *   export default { fetch: withErrorContext(myHandler.fetch) }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorContext<T extends (...args: any[]) => any>(fn: T): T {
  if (!als) return fn; // Graceful no-op on unsupported runtimes.
  return ((...args: Parameters<T>) => als!.run({ slot: undefined }, () => fn(...args))) as T;
}
