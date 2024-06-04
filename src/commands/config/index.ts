import { CmdInfoSupplier } from "../types";
import { CombinedConfigResolver, DEFAULT_CONFIG_PATH } from "../../config";

export const ConfigSetCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("config:set")
    .description("Stores config value in file")
    .argument("<string>", "Config name")
    .argument("<string>", "Config value")
    .option("-c --config <path>", "Config file path")
    .action((name, value, opts) => {
      const configResolver = new CombinedConfigResolver(
        opts.config || DEFAULT_CONFIG_PATH
      );

      configResolver.setEnv(name, value);
    });

export const ConfigDeleteCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("config:delete")
    .description("Delete config value from file")
    .argument("name", "Config name")
    .option("-c --config <path>", "Config file path")
    .action((name, opts) => {
      const configResolver = new CombinedConfigResolver(
        opts.config || DEFAULT_CONFIG_PATH
      );

      configResolver.deleteEnv(name);
    });
