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
import { dockerUtils } from "utils";

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
    await dockerUtils.pullImage(this.docker, stage.image);
    if (stage.interactive) {
      return this.runInteraciveStage(formulaPath, stage as any);
    } else {
      return this.runRegularStage(formulaPath, stage as any);
    }
  }

  async runRegularStage(
    formulaPath: string,
    stage: TaskStageInstruction & { interactive?: false }
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

  resize(container: Dockerode.Container) {
    var dimensions = {
      h: process.stdout.rows,
      w: process.stderr.columns,
    };

    if (dimensions.h != 0 && dimensions.w != 0) {
      container.resize(dimensions, function () {});
    }
  }

  private async runInteraciveStage(
    formulaPath: string,
    stage: TaskStageInstruction & { interactive: true }
  ): Promise<Array<{ id: string; value: any }>> {
    const workdir = normalize(join(getFormulaPath(formulaPath)));

    const isOutputsExpected = "outputs" in stage && stage.outputs.length;

    const out = this.createStream("stdout");

    const container = await this.docker.createContainer({
      Env: Object.entries(stage.envs)
        .map(([name, val]) => [name, this.state.toValue(val)])
        .map(([name, val]) => `${name}=${val}`)
        .concat(`DREW_WORKDIR=${this.state.toValue(stage.workdir)}`),
      Image: stage.image,
      Hostname: "",
      User: "",
      Cmd: stage.cmd.map((cmd) => this.state.toValue(cmd)),
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      OpenStdin: true,
      StdinOnce: false,
      HostConfig: { AutoRemove: true, Binds: [`${workdir}:/project:ro`] },
    });
    const isRaw = process.stdin.isRaw;

    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true,
    });

    // Show outputs
    stream.pipe(out.stream);

    // Connect stdin
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.pipe(stream);

    await container.start();
    this.resize(container);
    out.stream.on("resize", () => {
      this.resize(container);
    });

    await container.wait();

    process.stdin.setRawMode(isRaw);

    const outText = out.inMemory.toString();

    return isOutputsExpected
      ? stage.outputs
          .filter((o) => o.extract != null)
          .map((o) => ({
            id: o.id,
            value: this.readOutput(outText, outText, o),
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
