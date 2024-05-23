import Dockerode from "dockerode";
import { StageInstruction } from "engine";
import { getFormulaPath } from "../fetcher";
import { normalize, join } from "path";

export class TaskExecutor {
  private readonly docker: Dockerode;

  constructor(dockerOpts?: Dockerode.DockerOptions) {
    this.docker = new Dockerode(dockerOpts);
  }

  async runStage(formulaPath: string, stage: StageInstruction) {
    const workdir = normalize(join(getFormulaPath(formulaPath)));
    await this.docker.run(stage.image, stage.cmd, process.stdout, {
      Env: Object.entries(stage.envs)
        .map(([name, val]) => `${name}=${val}`)
        .concat(`HH_WORKDIR=${stage.workdir}`),
      AttachStdout: true,
      AttachStderr: true,
      HostConfig: { AutoRemove: true, Binds: [`${workdir}:/project:ro`] },
    });
  }
}
