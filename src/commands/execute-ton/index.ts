import { parse, StageInstruction, validate } from "@drewpackages/engine";
import {
  CombinedConfigResolver,
  TaskExecutor,
  OffchainExecutor,
  StateStorage,
  ConfigStorage,
  FormulaExecutionDump,
  GitHubFetcher,
  EnvConfigResolver,
  StoredConfigResolver,
} from "@drewpackages/host-common";
import { CmdInfoSupplier } from "../types";
import { DEFAULT_CONFIG_PATH } from "../../config";
import { normalize, join } from "node:path";
import fs from "fs-extra";
import { FORMULAS_DIR, getFormulaPath } from "../../fetcher";

export const ExecuteTonCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("deploy-ton")
    .description("Deploy drew formula on Ton chain")
    .argument("[string]", "Formula")
    .option("-p --params <object>", "Formula parameters as json object")
    .option("-c --config <path>", "Config file path")
    .option("--dryRun", "Dry run formula deployment")
    .option(
      "--dumpAfter <number>",
      "Number of executed steps before dump save",
      "-1"
    )
    .option("--dumpFileName <path>", "File name for dump save", "./dump.json")
    .option("-f --fromDump", "Should read from dump", false)
    .action(async (formula, opts) => {
      const dumpPath = normalize(join(process.cwd(), opts.dumpFileName));
      const dumpFileExists = fs.existsSync(dumpPath);

      const dump: FormulaExecutionDump | undefined = Boolean(opts.fromDump)
        ? JSON.parse(fs.readFileSync(dumpPath).toString("utf-8"))
        : undefined;

      if (!formula && !dumpFileExists) {
        console.log("Formula name or dump file should be provided");
      }

      let formulaName = formula || dump!.formulaName;

      const state = new StateStorage();
      dump && state.fromDump(dump.state);
      const config = new ConfigStorage();
      dump && config.fromDump(dump.config);

      let instructions: Array<StageInstruction>;

      const fetcher = new GitHubFetcher(FORMULAS_DIR);

      if (!dump) {
        const configResolver = new CombinedConfigResolver(
          new EnvConfigResolver(),
          new StoredConfigResolver(opts.config || DEFAULT_CONFIG_PATH)
        );

        const steps = await validate(
          {
            formulaName,
          },
          fetcher,
          state,
          opts.params && typeof opts.params === "string"
            ? JSON.parse(opts.params)
            : {}
        );

        instructions = await parse(steps, configResolver, state, config);
      } else {
        await fetcher.fetchFormulaFileText(formulaName, "formula.js");
        instructions = dump.instructions;
      }

      const tasks = new TaskExecutor(state, getFormulaPath);
      const offchain = new OffchainExecutor(state, getFormulaPath);

      if (opts.dryRun) {
        console.log("Instructions for execution");
        console.log(JSON.stringify(instructions, null, 2));
      } else {
        const dumpAfter = opts.dumpAfter ? Number.parseInt(opts.dumpAfter) : -1;
        const isDumpRequired = dumpAfter >= 0;
        const formulaNameWithoutRev = formulaName.replace(/\@.+/, "");
        for (
          let index = dump?.executedSteps || 0;
          index < (isDumpRequired ? dumpAfter : instructions.length);
          index++
        ) {
          const instruction = instructions[index];
          if (instruction.type === "task") {
            const outputs = await tasks.runStage(
              formulaNameWithoutRev,
              instruction
            );
            state.addResolvedValues(outputs);
          }
          if (instruction.type === "offchain") {
            await offchain.runStage(formulaNameWithoutRev, instruction);
          }
        }

        if (isDumpRequired) {
          const dump: FormulaExecutionDump = {
            config: config.toDump(),
            state: state.toDump(),
            executedSteps: dumpAfter,
            instructions,
            formulaName: await fetcher.getUnambiguousFormulaName(formulaName),
          };

          fs.writeFileSync(dumpPath, JSON.stringify(dump, null, 2));
        }
      }
    });
