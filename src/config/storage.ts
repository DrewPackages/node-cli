import { errors, IConfigStorage, ConfigRef } from "@drewpackages/engine";
import { IDumpable } from "../dump";
import z from "zod";

const ConfigStorageDumpSchema = z
  .object({
    storage: z.record(z.string().min(1), z.any()),
  })
  .required({ storage: true });

export type IConfigStorageDump = z.infer<typeof ConfigStorageDumpSchema>;

export class ConfigStorage<T extends object>
  implements IConfigStorage, IDumpable<IConfigStorageDump>
{
  private readonly storage: Map<string, object> = new Map();

  set(api: string, resolvedConfig: T) {
    if (this.storage.has(api)) {
      throw new errors.ApiConfigAlreadyResolvedError(api);
    }
    this.storage.set(api, resolvedConfig);
  }

  get(api: string): T {
    if (!this.storage.has(api)) {
      throw new errors.ApiConfigNotResolvedError(api);
    }
    return this.storage.get(api) as T;
  }

  resolve(ref: ConfigRef): string {
    if (!this.storage.has(ref.group)) {
      throw new errors.ApiConfigNotResolvedError(ref.group);
    }

    return (this.storage.get(ref.group) as any)[ref.key];
  }

  isCorrectDump(maybeDump: any): maybeDump is IConfigStorageDump {
    return ConfigStorageDumpSchema.safeParse(maybeDump).success;
  }

  toDump(): IConfigStorageDump {
    return { storage: Object.fromEntries(this.storage.entries()) };
  }

  fromDump(dump: IConfigStorageDump): undefined {
    Object.getOwnPropertyNames(dump.storage!).forEach((key) =>
      this.storage.set(key, dump.storage[key])
    );
  }
}
