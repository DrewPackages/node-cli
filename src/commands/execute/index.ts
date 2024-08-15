import { parse, StageInstruction, validate } from "@drewpackages/engine";
import { FORMULAS_DIR, getFormulaPath } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { DEFAULT_CONFIG_PATH } from "../../config";
import {
  CombinedConfigResolver,
  TaskExecutor,
  OffchainExecutor,
  StateStorage,
  ConfigStorage,
  FormulaExecutionDump,
  GitHubFetcher,
} from "@drewpackages/host-common";
import prompts from "prompts";
import z from "zod";
import { normalize, join } from "path";
import fs from "fs-extra";

const AVAILABLE_NETWORK_RPCS: Array<{ title: string; value: string }> = [
  {
    title: "Sepolia",
    value: "https://ethereum-sepolia.rpc.subquery.network/public",
  },
  {
    title: "Optimism Sepolia",
    value: "https://sepolia.optimism.io",
  },
  {
    title: "Arbitrum Sepolia",
    value: "https://sepolia-rollup.arbitrum.io/rpc",
  },
  {
    title: "Polygon Mumbai",
    value: "https://polygon-testnet.public.blastapi.io",
  },
];

async function checkRpcUrl(config: CombinedConfigResolver) {
  try {
    await config.getEnv("RPC_URL");
  } catch {
    const url = await prompts([
      {
        name: "value",
        type: "select",
        message: "Select network node",
        choices: [...AVAILABLE_NETWORK_RPCS, { title: "Custom", value: null }],
      },
      {
        name: "customRpc",
        message: "Put your RPC url",
        type: (prev) => (prev == null ? "text" : null),
        validate: (val) =>
          z.string().url().safeParse(val).success
            ? true
            : `Malformed url: ${val}`,
      },
    ]);
    const receivedUrl = url.customRpc || url.value;
    if (receivedUrl) {
      config.setEnv("RPC_URL", receivedUrl);
    } else {
      throw new Error("Rpc url not provided");
    }
  }
}

async function checkPrivateKey(config: CombinedConfigResolver) {
  try {
    await config.getEnv("PRIVATE_KEY");
  } catch {
    const result = await prompts({
      name: "value",
      type: "text",
      message: "Provide your private key",
      validate: (val) =>
        z.string().startsWith("0x").length(66).safeParse(val).success
          ? true
          : `Malformed private key ${val}`,
    });
    if (result.value) {
      config.setEnv("PRIVATE_KEY", result.value);
    } else {
      throw new Error("Private key not provided");
    }
  }
}

export const ExecuteEVMCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("deploy")
    .description("Deploy drew formula")
    .argument("<string>", "Formula")
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
          opts.config || DEFAULT_CONFIG_PATH
        );
        await checkRpcUrl(configResolver);
        await checkPrivateKey(configResolver);

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
