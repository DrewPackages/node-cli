import { ValidateCommandInfo } from "./validate";
import { ExecuteEVMCommandInfo } from "./execute";
import { ExecuteTonCommandInfo } from "./execute-ton";
import { ConfigDeleteCommandInfo, ConfigSetCommandInfo } from "./config";
import { Command } from "commander";

export function provideCli(program: Command): Command {
  ValidateCommandInfo(program);
  ExecuteEVMCommandInfo(program);
  ExecuteTonCommandInfo(program)
  ConfigSetCommandInfo(program);
  ConfigDeleteCommandInfo(program);

  return program;
}
