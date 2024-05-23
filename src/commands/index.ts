import { createDefaultCli } from "@hediet/cli";
import { CmdExecutor } from "./types";
import { ValidateCommandInfo } from "./validate";
import { ExecuteCommandInfo } from "./execute";
import { ConfigDeleteCommandInfo, ConfigSetCommandInfo } from "./config";

export function provideCli() {
  const cli = createDefaultCli<CmdExecutor>();
  ValidateCommandInfo(cli);
  ExecuteCommandInfo(cli);
  ConfigSetCommandInfo(cli);
  ConfigDeleteCommandInfo(cli);

  return cli;
}
