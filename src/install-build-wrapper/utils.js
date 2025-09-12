import * as exec from "@actions/exec";
import * as path from "path";

/**
 * Compute all names and paths related to the build wrapper
 * based on the runner environment
 */
export function getBuildWrapperInfo({
  runnerOS,
  runnerArch,
  runnerTemp,
  sonarHostUrl,
}) {
  const { buildWrapperSuffix, buildWrapperName } = getSuffixAndName(
    runnerOS,
    runnerArch
  );

  const buildWrapperDir = `${runnerTemp}/build-wrapper-${buildWrapperSuffix}`;
  const buildWrapperUrl = `${sonarHostUrl}/static/cpp/build-wrapper-${buildWrapperSuffix}.zip`;
  const buildWrapperBin = `${buildWrapperDir}/${buildWrapperName}`;

  return {
    buildWrapperUrl,
    buildWrapperDir,
    buildWrapperBin,
  };
}

function getSuffixAndName(runnerOS, runnerArch) {
  if (
    runnerArch !== "X64" &&
    !(runnerArch === "ARM64" && (runnerOS === "macOS" || runnerOS === "Linux"))
  ) {
    throw new Error(
      `Architecture '${runnerArch}' is unsupported by build-wrapper`
    );
  }

  switch (runnerOS) {
    case "Windows":
      return {
        buildWrapperSuffix: "win-x86",
        buildWrapperName: "build-wrapper-win-x86-64.exe",
      };

    case "Linux":
      switch (runnerArch) {
        case "X64":
          return {
            buildWrapperSuffix: "linux-x86",
            buildWrapperName: "build-wrapper-linux-x86-64",
          };

        case "ARM64":
          return {
            buildWrapperSuffix: "linux-aarch64",
            buildWrapperName: "build-wrapper-linux-aarch64",
          };
      }
      break; // handled before the switch

    case "macOS":
      return {
        buildWrapperSuffix: "macosx-x86",
        buildWrapperName: "build-wrapper-macosx-x86",
      };

    default:
      throw new Error(`Unsupported runner OS '${runnerOS}'`);
  }
}

export async function getRealPath(filePath, runnerOS) {
  switch (runnerOS) {
    case "Windows": {
      const windowsResult = await exec.getExecOutput("cygpath", [
        "--absolute",
        "--windows",
        filePath,
      ]);
      return windowsResult.stdout.trim();
    }
    case "Linux": {
      const linuxResult = await exec.getExecOutput("readlink", [
        "-f",
        filePath,
      ]);
      return linuxResult.stdout.trim();
    }
    case "macOS": {
      const macResult = await exec.getExecOutput("greadlink", ["-f", filePath]);
      return macResult.stdout.trim();
    }
    default:
      return path.resolve(filePath);
  }
}
