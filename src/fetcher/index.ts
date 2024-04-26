import { IFormulaFetcher } from "engine";
import simpleGit from "simple-git";
import { normalize, join } from "path";
import fsExtra from "fs-extra";

const { readFile, mkdir, opendir } = fsExtra;

type ParsedFormulaRef = {
  repo: string;
  subtree?: string;
  rev?: string;
};

async function isEmptyDir(path: string) {
  try {
    const directory = await opendir(path);
    const entry = await directory.read();
    await directory.close();

    return entry === null;
  } catch (error) {
    return false;
  }
}

class GitHubFetcher implements IFormulaFetcher {
  private parseRef(formulaRef: string): ParsedFormulaRef {
    const rev = formulaRef.includes("@") ? formulaRef.split("@")[1] : undefined;
    const segments = formulaRef.split("/").map((s) => s.replace(`@${rev}`, ""));

    return {
      repo: `${segments[0]}/${segments[1]}`,
      subtree: segments.length > 2 ? segments.slice(2).join("/") : undefined,
      rev,
    };
  }

  private async clone(formulaRef: ParsedFormulaRef) {
    const repoPath = normalize(
      join(process.env.HOME as string, `/.drew/formulas/${formulaRef.repo}`)
    );
    await mkdir(repoPath, { recursive: true });
    const git = simpleGit(repoPath);
    await git.cwd({ path: repoPath });

    if (await isEmptyDir(repoPath)) {
      await git.clone(`git@github.com:${formulaRef.repo}.git`, repoPath);
    } else {
      await git.pull();
    }
    if (formulaRef.rev) {
      await git.checkout(formulaRef.rev);
    }
  }

  private async readClonnedFile(
    formulaRef: ParsedFormulaRef,
    filePath: string
  ): Promise<string> {
    const repoPath = normalize(
      join(process.env.HOME!, `/.drew/formulas`, formulaRef.repo)
    );
    const formulaDirname = formulaRef.subtree
      ? normalize(join(repoPath, formulaRef.subtree))
      : repoPath;

    const buffer = await readFile(join(formulaDirname, filePath));
    return buffer.toString("utf-8");
  }

  async fetchFormulaFileText(
    formulaRef: string,
    filePath: string
  ): Promise<string> {
    const parsedFormulaRef = this.parseRef(formulaRef);
    await this.clone(parsedFormulaRef);
    return this.readClonnedFile(parsedFormulaRef, filePath);
  }
}

export const fetcher = new GitHubFetcher();
