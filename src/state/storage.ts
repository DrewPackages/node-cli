import {
  IStateStorage,
  ScheduleOutput,
  ValueOrOutput,
  isScheduleOutput,
} from "@drewpackages/engine";
import { IStateStorageDump, StateStorageDumpSchema } from "./dump";
import { IDumpable } from "dump";

export class StateStorage
  implements IStateStorage, IDumpable<IStateStorageDump>
{
  private readonly registeredIds: Set<string> = new Set();

  private readonly resolvedValues: Map<string, any> = new Map();

  addResolvedValues(outputs: Array<{ id: string; value: any }>) {
    outputs.forEach((o) => this.resolvedValues.set(o.id, o.value));
  }

  registerOutputs(outputs: ScheduleOutput[]) {
    for (let index = 0; index < outputs.length; index++) {
      const output = outputs[index];

      if (this.registeredIds.has(output.id)) {
        throw new Error(`Output id '${output.id}' already registered`);
      }

      this.registeredIds.add(output.id);
    }
  }

  isOutputResolved(outputId: string): boolean {
    if (!this.registeredIds.has(outputId)) {
      throw new Error(`Output id '${outputId}' not registered`);
    }

    return this.resolvedValues.has(outputId);
  }

  getOutputValue<T>(outputId: string): T {
    if (!this.registeredIds.has(outputId)) {
      throw new Error(`Output id '${outputId}' not registered`);
    }

    if (!this.resolvedValues.has(outputId)) {
      throw new Error(`Output with id '${outputId}' not resolved`);
    }

    return this.resolvedValues.get(outputId);
  }

  toValue<T>(valueOrOutput: ValueOrOutput<T>): T {
    if (isScheduleOutput(valueOrOutput)) {
      return this.getOutputValue(valueOrOutput.id);
    }

    return valueOrOutput;
  }

  isCorrectDump(
    maybeDump: any
  ): maybeDump is { outputIds: string[]; resolvedValues: Map<string, any> } {
    return StateStorageDumpSchema.safeParse(maybeDump).success;
  }

  toDump(): IStateStorageDump {
    return {
      outputIds: Array.from(this.registeredIds.values()),
      resolvedValues: Object.fromEntries(this.resolvedValues.entries()),
    };
  }

  fromDump(dump: IStateStorageDump): undefined {
    dump.outputIds.forEach((id) => this.registeredIds.add(id));
    Object.getOwnPropertyNames(dump.resolvedValues).forEach((key) => {
      this.resolvedValues.set(
        key,
        "get" in dump.resolvedValues
          ? dump.resolvedValues.get(key)
          : dump.resolvedValues[key]
      );
    });
  }
}
