import { normalize, join } from "path";

export const FORMULAS_DIR = normalize(
  join(process.env.HOME as string, `/.drew/formulas`)
);

export function getFormulaPath(formulaName: string): string {
  return normalize(join(FORMULAS_DIR, formulaName));
}
