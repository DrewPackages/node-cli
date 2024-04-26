import { IEnvironmentResolver } from "engine";

export class EnvConfigResolver implements IEnvironmentResolver {
  private readEnv(name: string): string {
    if (name in process.env) {
      return process.env[name]!;
    }
    throw new Error(`Config not found error`);
  }

  async getEnv(name: string): Promise<string> {
    return this.readEnv(name);
  }

  async getEnvBatch(...names: string[]): Promise<Record<string, string>> {
    return Object.fromEntries(names.map((n) => [n, this.readEnv(n)]));
  }
}

export const configResolver = new EnvConfigResolver();
