import { StageInstruction } from "@drewpackages/engine";
import { IConfigStorageDump } from "config/storage";
import { IStateStorageDump } from "state/dump";

export interface IDumpable<D extends object> {
  isCorrectDump(maybeDump: any): maybeDump is D;
  toDump(): D | Promise<D>;
  fromDump(dump: D): void | Promise<void>;
}

export interface FormulaExecutionDump {
  config: IConfigStorageDump;
  state: IStateStorageDump;
  instructions: Array<StageInstruction>;
  executedSteps: number;
  formulaName: string;
}
