import type { CorsOptions } from "cors";
import { env } from "./env";

const allowedOrigins = env.corsOrigin
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS origin not allowed"));
  },
  credentials: true
};
