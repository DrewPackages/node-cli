import { ValidateCommandInfo } from "./validate";
import { ExecuteCommandInfo } from "./execute";
import { ConfigDeleteCommandInfo, ConfigSetCommandInfo } from "./config";
import { Command } from "commander";

export function provideCli(program: Command): Command {
  ValidateCommandInfo(program);
  ExecuteCommandInfo(program);
  ConfigSetCommandInfo(program);
  ConfigDeleteCommandInfo(program);

  return program;
}
