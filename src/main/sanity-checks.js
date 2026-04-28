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

import fs from "node:fs";
import { join } from "node:path";

export function validateScannerVersion(version) {
  if (!version) {
    return;
  }

  const versionRegex = /^\d+\.\d+\.\d+\.\d+$/;
  if (!versionRegex.test(version)) {
    throw new Error(
      "Invalid scannerVersion format. Expected format: x.y.z.w (e.g., 7.1.0.4889)"
    );
  }
}

export function checkSonarToken(core, sonarToken) {
  if (!sonarToken) {
    core.warning(
      "Running this GitHub Action without SONAR_TOKEN is not recommended"
    );
  }
}

export function checkMavenProject(core, projectBaseDir) {
  const pomPath = join(projectBaseDir.replace(/\/$/, ""), "pom.xml");
  if (fs.existsSync(pomPath)) {
    core.warning(
      "Maven project detected. Sonar recommends running the 'org.sonarsource.scanner.maven:sonar-maven-plugin:sonar' goal during the build process instead of using this GitHub Action to get more accurate results."
    );
  }
}

export function checkGradleProject(core, projectBaseDir) {
  const baseDir = projectBaseDir.replace(/\/$/, "");
  const gradlePath = join(baseDir, "build.gradle");
  const gradleKtsPath = join(baseDir, "build.gradle.kts");

  if (fs.existsSync(gradlePath) || fs.existsSync(gradleKtsPath)) {
    core.warning(
      "Gradle project detected. Sonar recommends using the SonarQube plugin for Gradle during the build process instead of using this GitHub Action to get more accurate results."
    );
  }
}
