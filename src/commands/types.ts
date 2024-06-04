import { Command } from "commander";

export type CmdExecutor = {
  run(): Promise<void>;
};

export type CmdInfoSupplier = (cli: Command) => void;
