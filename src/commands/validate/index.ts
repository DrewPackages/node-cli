import { positionalParam, types } from "@hediet/cli";
import { validate } from "engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";

export const ValidateCommandInfo: CmdInfoSupplier = (cli) =>
  cli.addCmd({
    name: "check",
    positionalParams: [
      positionalParam("formula", types.string, {
        description: "Formula to check against",
      }),
    ],
    getData: (args) => ({
      async run() {
        const steps = await validate(
          {
            formulaName: args.formula,
            values: {},
          },
          fetcher
        );

        const usedApis = steps.map(
          (s) => `${s.group}/v${s.version}/${s.method}`
        );

        console.log(`Used apis: \n\t${usedApis.join("\n\t")}`);
      },
    }),
  });
