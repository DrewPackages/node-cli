import { Command } from "commander";
import packageJson from "../package.json" assert { type: "json" };
import path from "node:path";
import { provideCli } from "./commands";
import { fileURLToPath } from "url";

const program = new Command();

program
  .name("drew")
  .description("CLI for dApp deployments on EVM and Ton chains")
  .version(packageJson.version);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
provideCli(program);

program.parse();
