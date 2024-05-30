import { IStateStorage, ScheduleOutput } from "engine";

export class StateStorage implements IStateStorage {
  private readonly registeredIds: Set<string> = new Set();

  private readonly resolvedValues: Map<string, any> = new Map();

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
}
