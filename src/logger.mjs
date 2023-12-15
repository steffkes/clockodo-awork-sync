import { createLogger, format, transports } from "winston";

const logger = createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          ({ timestamp, level, message, ...rest }) =>
            `${timestamp} ${level}: ${message} ${
              Object.keys(rest).length ? JSON.stringify(rest) : ""
            }`,
        ),
      ),
    }),
  );
}

export default logger;
