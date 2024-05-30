import { namedParam, positionalParam, types } from "@hediet/cli";
import { validate } from "engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { StateStorage } from "../../state";

export const ValidateCommandInfo: CmdInfoSupplier = (cli) =>
  cli.addCmd({
    name: "check",
    positionalParams: [
      positionalParam("formula", types.string, {
        description: "Formula to check against",
      }),
    ],
    namedParams: {
      formulaParams: namedParam(types.string.withDefaultValue(""), {
        description: "Formula parameters in json format",
      }),
    },
    getData: (args) => ({
      async run() {
        const state = new StateStorage();
        const steps = await validate(
          {
            formulaName: args.formula,
          },
          fetcher,
          state,
          args.formulaParams !== "" ? JSON.parse(args.formulaParams) : undefined
        );

        const usedApis = steps.map(
          (s) => `${s.group}/v${s.version}/${s.method}`
        );

        console.log(`Used apis: \n\t${usedApis.join("\n\t")}`);
      },
    }),
  });
