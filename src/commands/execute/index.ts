import { namedParam, positionalParam, types } from "@hediet/cli";
import { parse, validate } from "engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { CombinedConfigResolver, DEFAULT_CONFIG_PATH } from "../../config";

export const ExecuteCommandInfo: CmdInfoSupplier = (cli) =>
  cli.addCmd({
    name: "execute",
    positionalParams: [
      positionalParam("formula", types.string, {
        description: "Formula to execute",
      }),
    ],
    namedParams: {
      formulaParams: namedParam(types.string.withDefaultValue(""), {
        description: "Formula parameters in json format",
      }),
      configFile: namedParam(types.string.withDefaultValue(""), {
        description: "Optional different execution params file",
      }),
    },
    getData: (args) => ({
      async run() {
        const steps = await validate(
          {
            formulaName: args.formula,
            values: {},
          },
          fetcher,
          args.formulaParams !== "" ? JSON.parse(args.formulaParams) : undefined
        );

        const configResolver = new CombinedConfigResolver(
          args.configFile || DEFAULT_CONFIG_PATH
        );

        const instructions = await parse(steps, configResolver);

        console.log("Instructions for execution");
        console.log(JSON.stringify(instructions, null, 2));
      },
    }),
  });
