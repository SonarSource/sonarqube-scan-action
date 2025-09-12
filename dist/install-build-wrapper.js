import { f as execExports, e as coreExports } from './exec-BTlTa8sL.js';
import * as fs from 'fs';
import * as path from 'path';
import 'os';
import 'crypto';
import 'http';
import 'https';
import 'net';
import 'tls';
import 'events';
import 'assert';
import 'util';
import 'stream';
import 'buffer';
import 'querystring';
import 'stream/web';
import 'node:stream';
import 'node:util';
import 'node:events';
import 'worker_threads';
import 'perf_hooks';
import 'util/types';
import 'async_hooks';
import 'console';
import 'url';
import 'zlib';
import 'string_decoder';
import 'diagnostics_channel';
import 'child_process';
import 'timers';

/**
 * Compute all names and paths related to the build wrapper
 * based on the runner environment
 */
function getBuildWrapperInfo({
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

async function getRealPath(filePath, runnerOS) {
  switch (runnerOS) {
    case "Windows": {
      const windowsResult = await execExports.getExecOutput("cygpath", [
        "--absolute",
        "--windows",
        filePath,
      ]);
      return windowsResult.stdout.trim();
    }
    case "Linux": {
      const linuxResult = await execExports.getExecOutput("readlink", [
        "-f",
        filePath,
      ]);
      return linuxResult.stdout.trim();
    }
    case "macOS": {
      const macResult = await execExports.getExecOutput("greadlink", ["-f", filePath]);
      return macResult.stdout.trim();
    }
    default:
      return path.resolve(filePath);
  }
}

async function installMacOSPackages() {
  if (process.platform === "darwin") {
    coreExports.info("Installing required packages for macOS");
    await execExports.exec("brew", ["install", "coreutils"]);
  }
}

/**
 * These RUNNER_XX env variables come from GitHub by default.
 * See https://docs.github.com/en/actions/reference/workflows-and-actions/variables#default-environment-variables
 *
 * If SONAR_HOST_URL is omitted, we assume sonarcloud.io
 */
function getEnvVariables() {
  const sonarHostUrl = process.env.SONAR_HOST_URL
    ? process.env.SONAR_HOST_URL.replace(/\/$/, "")
    : "https://sonarcloud.io";

  return {
    runnerOS: process.env.RUNNER_OS,
    runnerArch: process.env.RUNNER_ARCH,
    runnerTemp: process.env.RUNNER_TEMP,
    sonarHostUrl,
  };
}

async function downloadAndInstallBuildWrapper(downloadUrl, runnerEnv) {
  const { runnerArch, runnerOS, runnerTemp } = runnerEnv;
  const tmpZipPath = path.join(
    runnerTemp,
    `build-wrapper-${runnerOS}-${runnerArch}.zip`
  );

  coreExports.startGroup(`Download ${downloadUrl}`);

  coreExports.info(`Downloading '${downloadUrl}'`);

  if (!fs.existsSync(runnerTemp)) {
    fs.mkdirSync(runnerTemp, { recursive: true });
  }

  await execExports.exec("curl", ["-sSLo", tmpZipPath, downloadUrl]);

  coreExports.info("Decompressing");
  await execExports.exec("unzip", ["-o", "-d", runnerTemp, tmpZipPath]);

  coreExports.endGroup();
}

async function run() {
  try {
    await installMacOSPackages();

    const envVariables = getEnvVariables();

    const { buildWrapperBin, buildWrapperDir, buildWrapperUrl } =
      getBuildWrapperInfo(envVariables);

    await downloadAndInstallBuildWrapper(buildWrapperUrl, envVariables);

    const buildWrapperBinDir = await getRealPath(
      buildWrapperDir,
      envVariables.runnerOS
    );
    coreExports.addPath(buildWrapperBinDir);
    coreExports.info(`'${buildWrapperBinDir}' added to the path`);

    const buildWrapperBinPath = await getRealPath(
      buildWrapperBin,
      envVariables.runnerOS
    );
    coreExports.setOutput("build-wrapper-binary", buildWrapperBinPath);
    coreExports.info(`'build-wrapper-binary' output set to '${buildWrapperBinPath}'`);
  } catch (error) {
    coreExports.setFailed(error.message);
  }
}

run();
//# sourceMappingURL=install-build-wrapper.js.map
