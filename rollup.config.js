import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const config = {
  input: [
    "src/main/index.js",
    "src/install-build-wrapper/install-build-wrapper.js",
  ],
  output: {
    esModule: true,
    dir: "dist",
    format: "es",
    sourcemap: true,
  },
  plugins: [commonjs(), nodeResolve({ preferBuiltins: true })],
};

export default config;
