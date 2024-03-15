import type { Cli } from "@hediet/cli";

export type CmdExecutor = {
  run(): Promise<void>;
};

export type CmdInfoSupplier = (cli: Pick<Cli<CmdExecutor>, "addCmd">) => void;
