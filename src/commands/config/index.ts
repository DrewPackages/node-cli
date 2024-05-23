import { namedParam, positionalParam, types } from "@hediet/cli";
import { CmdInfoSupplier } from "../types";
import { CombinedConfigResolver, DEFAULT_CONFIG_PATH } from "../../config";

export const ConfigSetCommandInfo: CmdInfoSupplier = (cli) =>
  cli.addCmd({
    name: "config:set",
    positionalParams: [
      positionalParam("name", types.string, {
        description: "Config parameter name",
      }),
      positionalParam("value", types.string, {
        description: "Config parameter value",
      }),
    ],
    namedParams: {
      configFile: namedParam(types.string.withDefaultValue(""), {
        description: "Optional different execution params file",
      }),
    },
    getData: (args) => ({
      async run() {
        const configResolver = new CombinedConfigResolver(
          args.configFile || DEFAULT_CONFIG_PATH
        );

        configResolver.setEnv(args.name, args.value);
      },
    }),
  });

export const ConfigDeleteCommandInfo: CmdInfoSupplier = (cli) =>
  cli.addCmd({
    name: "config:delete",
    positionalParams: [
      positionalParam("name", types.string, {
        description: "Config parameter name",
      }),
    ],
    namedParams: {
      configFile: namedParam(types.string.withDefaultValue(""), {
        description: "Optional different execution params file",
      }),
    },
    getData: (args) => ({
      async run() {
        const configResolver = new CombinedConfigResolver(
          args.configFile || DEFAULT_CONFIG_PATH
        );

        configResolver.deleteEnv(args.name);
      },
    }),
  });
