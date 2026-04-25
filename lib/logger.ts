type LogLevel = "debug" | "info" | "warn" | "error";

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getConfiguredLevel(): LogLevel {
  // UI-only repo: simple env toggle via globalThis.
  // You can set (globalThis as any).__LOG_LEVEL__ = "debug" from the console/devtools.
  const v = (globalThis as any)?.__LOG_LEVEL__;
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  // Default: info in dev, warn in production.
  return __DEV__ ? "info" : "warn";
}

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[getConfiguredLevel()];
}

function fmt(tag: string, msg: string) {
  return `[${tag}] ${msg}`;
}

export const logger = {
  debug(tag: string, msg: string, data?: unknown) {
    if (!shouldLog("debug")) return;
    // eslint-disable-next-line no-console
    data === undefined ? console.log(fmt(tag, msg)) : console.log(fmt(tag, msg), data);
  },
  info(tag: string, msg: string, data?: unknown) {
    if (!shouldLog("info")) return;
    // eslint-disable-next-line no-console
    data === undefined ? console.log(fmt(tag, msg)) : console.log(fmt(tag, msg), data);
  },
  warn(tag: string, msg: string, data?: unknown) {
    if (!shouldLog("warn")) return;
    // eslint-disable-next-line no-console
    data === undefined ? console.warn(fmt(tag, msg)) : console.warn(fmt(tag, msg), data);
  },
  error(tag: string, msg: string, data?: unknown) {
    if (!shouldLog("error")) return;
    // eslint-disable-next-line no-console
    data === undefined ? console.error(fmt(tag, msg)) : console.error(fmt(tag, msg), data);
  },
};

