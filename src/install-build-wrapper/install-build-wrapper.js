// SonarQube Scan Action
// Copyright (C) SonarSource Sàrl
// mailto:contact AT sonarsource DOT com
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Lesser General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program; if not, write to the Free Software Foundation,
// Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.

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
