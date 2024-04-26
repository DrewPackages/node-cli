import { createDefaultCli } from "@hediet/cli";
import { CmdExecutor } from "./types";
import { ValidateCommandInfo } from "./validate";
import { ExecuteCommandInfo } from "./execute";

export function provideCli() {
  const cli = createDefaultCli<CmdExecutor>();
  ValidateCommandInfo(cli);
  ExecuteCommandInfo(cli);

  return cli;
}
