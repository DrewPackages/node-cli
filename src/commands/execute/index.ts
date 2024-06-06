import { parse, validate } from "@drewpackages/engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { CombinedConfigResolver, DEFAULT_CONFIG_PATH } from "../../config";
import { TaskExecutor } from "../../executor/tasks";
import { OffchainExecutor } from "../../executor/offchain";
import { StateStorage } from "../../state";
import prompts from "prompts";
import z from "zod";

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
      const configResolver = new CombinedConfigResolver(
        opts.config || DEFAULT_CONFIG_PATH
      );

      await checkRpcUrl(configResolver);
      await checkPrivateKey(configResolver);

      const steps = await validate(
        {
          formulaName: formula,
        },
        fetcher,
        state,
        opts.params !== "" ? JSON.parse(opts.params) : undefined
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
