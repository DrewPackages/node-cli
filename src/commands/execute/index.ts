import { namedParam, positionalParam, types } from "@hediet/cli";
import { parse, validate } from "engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { CombinedConfigResolver, DEFAULT_CONFIG_PATH } from "../../config";
import { TaskExecutor } from "../../executor/tasks";
import { OffchainExecutor } from "../../executor/offchain";
import { StateStorage } from "../../state";

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
      dryRun: namedParam(types.booleanFlag, {
        description: "Just show execution plan",
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

        const configResolver = new CombinedConfigResolver(
          args.configFile || DEFAULT_CONFIG_PATH
        );

        const instructions = await parse(steps, configResolver, state);

        const tasks = new TaskExecutor();
        const offchain = new OffchainExecutor();

        if (args.dryRun) {
          console.log("Instructions for execution");
          console.log(JSON.stringify(instructions, null, 2));
        } else {
          for (let index = 0; index < instructions.length; index++) {
            const instruction = instructions[index];
            if (instruction.type === "task") {
              await tasks.runStage(args.formula, instruction);
            }
            if (instruction.type === "offchain") {
              await offchain.runStage(args.formula, instruction);
            }
          }
        }
      },
    }),
  });
