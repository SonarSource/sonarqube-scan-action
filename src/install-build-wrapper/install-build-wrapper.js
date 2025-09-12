import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";
import { getBuildWrapperInfo, getRealPath } from "./utils";

async function installMacOSPackages() {
  if (process.platform === "darwin") {
    core.info("Installing required packages for macOS");
    await exec.exec("brew", ["install", "coreutils"]);
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

  core.startGroup(`Download ${downloadUrl}`);

  core.info(`Downloading '${downloadUrl}'`);

  if (!fs.existsSync(runnerTemp)) {
    fs.mkdirSync(runnerTemp, { recursive: true });
  }

  await exec.exec("curl", ["-sSLo", tmpZipPath, downloadUrl]);

  core.info("Decompressing");
  await exec.exec("unzip", ["-o", "-d", runnerTemp, tmpZipPath]);

  core.endGroup();
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
    core.addPath(buildWrapperBinDir);
    core.info(`'${buildWrapperBinDir}' added to the path`);

    const buildWrapperBinPath = await getRealPath(
      buildWrapperBin,
      envVariables.runnerOS
    );
    core.setOutput("build-wrapper-binary", buildWrapperBinPath);
    core.info(`'build-wrapper-binary' output set to '${buildWrapperBinPath}'`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
