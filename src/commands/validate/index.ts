import { validate } from "@drewpackages/engine";
import { fetcher } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { StateStorage } from "../../state";

export const ValidateCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("check")
    .description("Check formula executability")
    .argument("<string>", "Formula name")
    .option("-p --params <object>", "Formula parameters as json object")
    .action(async (formula, opts) => {
      const state = new StateStorage();
      const steps = await validate(
        {
          formulaName: formula,
        },
        fetcher,
        state,
        opts.params && typeof opts.params ? JSON.parse(opts.params) : {}
      );

      const usedApis = steps.map((s) => `${s.group}/v${s.version}/${s.method}`);

      console.log(`Used apis: \n\t${usedApis.join("\n\t")}`);
    });
