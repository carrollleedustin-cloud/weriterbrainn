/**
 * Structured logger. Ready for upgrade to pino/winston.
 */
const isDebug = process.env.DEBUG === "true";

export const logger = {
  info(msg, meta = {}) {
    console.log(JSON.stringify({ level: "info", msg, ...meta }));
  },
  error(msg, err, meta = {}) {
    console.error(JSON.stringify({
      level: "error",
      msg,
      error: err?.message || String(err),
      stack: err?.stack,
      ...meta,
    }));
  },
  debug(msg, meta = {}) {
    if (isDebug) {
      console.log(JSON.stringify({ level: "debug", msg, ...meta }));
    }
  },
};
