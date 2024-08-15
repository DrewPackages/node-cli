import { validate } from "@drewpackages/engine";
import { FORMULAS_DIR } from "../../fetcher";
import { CmdInfoSupplier } from "../types";
import { GitHubFetcher, StateStorage } from "@drewpackages/host-common";

export const ValidateCommandInfo: CmdInfoSupplier = (program) =>
  program
    .command("check")
    .description("Check formula executability")
    .argument("<string>", "Formula name")
    .option("-p --params <object>", "Formula parameters as json object")
    .action(async (formula, opts) => {
      const state = new StateStorage();
      const fetcher = new GitHubFetcher(FORMULAS_DIR);
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
