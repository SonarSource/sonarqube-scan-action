import fs from "fs";
import { join } from "path";

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
