let sending = false;
let installed = false;

export function mirrorConsole() {
  if (typeof window === "undefined") return;
  if (installed) return; // prevent Fast Refresh duplication
  installed = true;

  const send = (type: string, args: unknown[]) => {
    if (sending) return;

    try {
      sending = true;

      const payload = JSON.stringify({
        type,
        args,
        ts: Date.now(),
        path: window.location.pathname,
      });

      navigator.sendBeacon(
        "/api/log",
        new Blob([payload], { type: "application/json" }),
      );
    } catch {
      // never log logger errors
    } finally {
      sending = false;
    }
  };

  const methods = ["error", "warn", "log", "info", "debug"] as const;

  for (const method of methods) {
    const original = console[method];

    console[method] = (...args: unknown[]) => {
      send(`console.${method}`, args);
      original.apply(console, args);
    };
  }

  window.addEventListener("error", (event) => {
    if (String(event.filename ?? "").includes("/api/log")) return;

    send("window.error", [
      event.message,
      event.filename,
      event.lineno,
      event.colno,
      event.error?.stack,
    ]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const msg = String(event.reason ?? "");
    if (msg.includes("/api/log")) return;

    send("unhandledrejection", [event.reason]);
  });
}
