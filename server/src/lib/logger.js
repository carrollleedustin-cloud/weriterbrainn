/**
 * Structured logging with Pino.
 * API: logger.info(msg, meta), logger.error(msg, err, meta), logger.debug(msg, meta)
 */
import pino from "pino";
import { config } from "../../config.js";

const isDev = config.env === "development";
const basePino = pino({
  level: config.debug ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
      },
    },
  }),
  base: {
    service: config.projectName,
    env: config.env,
  },
});

export const logger = {
  info(msg, meta = {}) {
    basePino.info(typeof meta === "object" && meta !== null ? meta : {}, msg);
  },
  error(msg, err, meta = {}) {
    basePino.error(
      {
        ...(typeof meta === "object" && meta !== null ? meta : {}),
        error: err?.message ?? String(err),
        stack: err?.stack,
      },
      msg
    );
  },
  warn(msg, meta = {}) {
    basePino.warn(typeof meta === "object" && meta !== null ? meta : {}, msg);
  },
  debug(msg, meta = {}) {
    basePino.debug(typeof meta === "object" && meta !== null ? meta : {}, msg);
  },
  child(bindings) {
    return basePino.child(bindings);
  },
};
