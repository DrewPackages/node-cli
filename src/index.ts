import { runDefaultCli, cliInfoFromPackageJson } from "@hediet/cli";
import path from "node:path";
import { provideCli } from "./commands";
import { fileURLToPath } from "url";

const cli = provideCli();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

runDefaultCli({
  info: cliInfoFromPackageJson(path.join(__dirname, "../package.json")),
  cli,
  // Asynchronously process an instance of `CmdData` here as you like.
  dataHandler: (data) => data.run(),
});
