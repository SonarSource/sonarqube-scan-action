const platformFlavor = {
  linux: {
    x64: "linux-x64",
    arm64: "linux-aarch64",
  },
  win32: {
    x64: "windows-x64",
  },
  darwin: {
    x64: "macosx-x64",
    arm64: "macosx-aarch64",
  },
};

export function getPlatformFlavor(platform, arch) {
  const flavor = platformFlavor[platform]?.[arch];

  if (!flavor) {
    throw new Error(`Platform ${platform} ${arch} not supported`);
  }

  return flavor;
}

export function getScannerDownloadURL({
  scannerBinariesUrl,
  scannerVersion,
  flavor,
}) {
  const trimURL = scannerBinariesUrl.replace(/\/$/, "");
  return `${trimURL}/sonar-scanner-cli-${scannerVersion}-${flavor}.zip`;
}

export const scannerDirName = (version, flavor) =>
  `sonar-scanner-${version}-${flavor}`;
