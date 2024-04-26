import { positionalParam, types } from "@hediet/cli";
import { parse, validate } from "engine";
import { fetcher } from "../../fetcher";
import { configResolver } from "../../config";
import { CmdInfoSupplier } from "../types";

export const ExecuteCommandInfo: CmdInfoSupplier = (cli) =>
  cli.addCmd({
    name: "execute",
    positionalParams: [
      positionalParam("formula", types.string, {
        description: "Formula to execute",
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

        const instructions = await parse(steps, configResolver);

        console.log("Instructions for execution");
        console.log(JSON.stringify(instructions, null, 2));
      },
    }),
  });
