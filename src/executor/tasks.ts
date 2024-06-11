import Dockerode from "dockerode";
import {
  RegexOutputSpec,
  ScheduleOutput,
  type TaskStageInstruction,
} from "@drewpackages/engine";
import { getFormulaPath } from "../fetcher";
import { normalize, join } from "path";
import { PassThrough } from "stream";
import { WritableStream } from "memory-streams";
import { StateStorage } from "state";

export class TaskExecutor {
  private readonly docker: Dockerode;

  constructor(
    private readonly state: StateStorage,
    dockerOpts?: Dockerode.DockerOptions
  ) {
    this.docker = new Dockerode(dockerOpts);
  }

  private createStream(to: "stderr" | "stdout"): {
    stream: NodeJS.WritableStream;
    inMemory: WritableStream;
  } {
    const stream = new PassThrough();
    const inMemory = new WritableStream();

    stream.on("data", (chunk) => {
      switch (to) {
        case "stderr":
          process.stderr.write(chunk);
        case "stdout":
          process.stdout.write(chunk);
      }
      inMemory.write(chunk);
    });

    return { stream, inMemory: inMemory };
  }

  async runStage(
    formulaPath: string,
    stage: TaskStageInstruction
  ): Promise<Array<{ id: string; value: any }>> {
    const workdir = normalize(join(getFormulaPath(formulaPath)));

    const isOutputsExpected = "outputs" in stage && stage.outputs.length;

    const stdout = this.createStream("stdout");
    const stderr = this.createStream("stderr");

    await this.docker.run(
      stage.image,
      stage.cmd.map((cmd) => this.state.toValue(cmd)),
      [stdout.stream, stderr.stream],
      {
        Env: Object.entries(stage.envs)
          .map(([name, val]) => [name, this.state.toValue(val)])
          .map(([name, val]) => `${name}=${val}`)
          .concat(`DREW_WORKDIR=${this.state.toValue(stage.workdir)}`),
        AttachStdin: stage.interactive,
        Tty: false,
        HostConfig: { AutoRemove: true, Binds: [`${workdir}:/project:ro`] },
      }
    );

    const stdoutText = stdout.inMemory.toString();
    const stderrText = stderr.inMemory.toString();

    return isOutputsExpected
      ? stage.outputs
          .filter((o) => o.extract != null)
          .map((o) => ({
            id: o.id,
            value: this.readOutput(stdoutText, stderrText, o),
          }))
      : [];
  }

  private readOutput(
    stdout: string,
    stderr: string,
    outputSpec: Pick<ScheduleOutput, "id" | "extract">
  ): any {
    if (!outputSpec.extract) {
      throw new Error(
        `Output specification for output '${outputSpec.id}' not found`
      );
    }
    switch (outputSpec.extract.type) {
      case "stderr":
        return stderr;
      case "stdout":
        return stdout;
      case "regex":
        return this.readRegexOut(stdout, stderr, outputSpec.extract);
    }
  }

  private readRegexOut(
    stdout: string,
    stderr: string,
    { expr, groupName, stream }: Omit<RegexOutputSpec, "type">
  ): string {
    const readFrom = stream === "stderr" ? stderr : stdout;
    const regex: RegExp = typeof expr === "string" ? RegExp(expr, "gm") : expr;

    const result = regex.exec(readFrom);

    if (
      result == null ||
      result.groups == null ||
      !(groupName in result.groups)
    ) {
      throw new Error(`Unable to get the regexp: "${regex.source}"`);
    }

    return result.groups[groupName];
  }
}
