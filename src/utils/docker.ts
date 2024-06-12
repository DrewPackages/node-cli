import Dockerode from "dockerode";

export function pullImage(
  docker: Dockerode,
  imageName: string
): Promise<boolean> {
  return new Promise((resolve, reject): any =>
    docker.pull(imageName, {}, (err, stream) => {
      function onFinished(err: Error | null, output: Array<any>) {
        if (!err) {
          resolve(true);
          return;
        }
        reject(err);
      }
      // https://github.com/apocas/dockerode/issues/357
      docker.modem.followProgress(stream!, onFinished);
    })
  );
}
