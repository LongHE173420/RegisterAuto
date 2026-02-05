import fs from "fs";
import path from "path";
import pino from "pino";
import { ENV } from "./env";

export function createFileLogger(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });


  const destination = pino.destination({ dest: filePath, sync: false });

  return pino(
    {
      base: null,
      level: ENV.LOG_LEVEL,
      timestamp: pino.stdTimeFunctions.isoTime,
      messageKey: "msg",

      serializers: {
        err: pino.stdSerializers.err,
      },
    },
    destination
  );
}
