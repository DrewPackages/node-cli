import path from "path";
import { defineConfig } from "rollup";
import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { builtinModules } from "module";
import terser from "@rollup/plugin-terser";
import shebang from "rollup-plugin-add-shebang";

export default defineConfig({
  input: "src/index.ts",
  output: {
    file: path.resolve("bin", "drew.js"),
    format: "es",
  },
  external: [
    ...builtinModules,
    "@drewpackages/engine",
    "commander",
    "dockerode",
    "fs-extra",
    "memory-streams",
    "simple-git",
    "prompts",
  ],
  plugins: [
    nodeResolve(),
    json(),
    typescript({
      exclude: "node_modules",
    }),
    terser(),
    shebang({
      include: path.resolve("bin", "drew.js"),
      shebang: "#!/usr/bin/env node",
    }),
  ],
  watch: {
    clearScreen: true,
    include: ["src/**/*.ts", "package.json"],
  },
});
