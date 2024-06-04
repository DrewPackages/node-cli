import { parse, validate } from "engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { CombinedConfigResolver, DEFAULT_CONFIG_PATH } from "../../config";
import { TaskExecutor } from "../../executor/tasks";
import { OffchainExecutor } from "../../executor/offchain";
import { StateStorage } from "../../state";

export const ExecuteCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("deploy")
    .description("Deploy drew formula")
    .argument("<string>", "Formula")
    .option("-p --params <object>", "Formula parameters as json object")
    .option("-c --config <path>", "Config file path")
    .option("--dryRun", "Dry run formula deployment")
    .action(async (formula, opts) => {
      const state = new StateStorage();
      const steps = await validate(
        {
          formulaName: formula,
        },
        fetcher,
        state,
        opts.params !== "" ? JSON.parse(opts.params) : undefined
      );

      const configResolver = new CombinedConfigResolver(
        opts.config || DEFAULT_CONFIG_PATH
      );

      const instructions = await parse(steps, configResolver, state);

      const tasks = new TaskExecutor(state);
      const offchain = new OffchainExecutor(state);

      if (opts.dryRun) {
        console.log("Instructions for execution");
        console.log(JSON.stringify(instructions, null, 2));
      } else {
        for (let index = 0; index < instructions.length; index++) {
          const instruction = instructions[index];
          if (instruction.type === "task") {
            const outputs = await tasks.runStage(formula, instruction);
            state.addResolvedValues(outputs);
          }
          if (instruction.type === "offchain") {
            await offchain.runStage(formula, instruction);
          }
        }
      }
    });
