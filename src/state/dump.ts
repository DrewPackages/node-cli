import z from "zod";

export const StateStorageDumpSchema = z.object({
  outputIds: z.array(z.string().min(1)),
  resolvedValues: z
    .map(z.string().min(1), z.any())
    .or(z.record(z.string(), z.any())),
});

export type IStateStorageDump = z.infer<typeof StateStorageDumpSchema>;
