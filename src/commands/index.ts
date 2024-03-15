import { createDefaultCli } from "@hediet/cli";
import { CmdExecutor } from "./types";
import { ValidateCommandInfo } from "./validate";

export function provideCli() {
  const cli = createDefaultCli<CmdExecutor>();
  ValidateCommandInfo(cli);

  return cli;
}
