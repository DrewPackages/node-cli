import { normalize, join } from "path";

export const DEFAULT_CONFIG_PATH = normalize(
  join(process.env.HOME!, `/.drew`, "config.json")
);
