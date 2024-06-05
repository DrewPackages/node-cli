import { IEnvironmentResolver } from "@drewpackages/engine";
import { EnvConfigResolver } from "./env";
import { StoredConfigResolver } from "./stored";

export class CombinedConfigResolver implements IEnvironmentResolver {
  private readonly envResolver: EnvConfigResolver;
  private readonly fsResolver: StoredConfigResolver;

  constructor(configFilePath: string) {
    this.envResolver = new EnvConfigResolver();
    this.fsResolver = new StoredConfigResolver(configFilePath);
  }

  async getEnv(name: string): Promise<string> {
    let result: string;
    try {
      result = await this.envResolver.getEnv(name);
    } catch {
      result = await this.fsResolver.getEnv(name);
    }
    return result;
  }

  async getEnvBatch(...names: string[]): Promise<Record<string, string>> {
    return Object.fromEntries(
      await Promise.all(names.map(async (n) => [n, await this.getEnv(n)]))
    );
  }

  setEnv(name: string, value: string) {
    this.fsResolver.setEnv(name, value);
  }

  deleteEnv(name: string) {
    this.fsResolver.deleteEnv(name);
  }
}
