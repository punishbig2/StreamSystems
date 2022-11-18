const exec = require("child_process").spawnSync;
const fs = require("fs");

const getAsString = (execResult) => {
  const { stdout } = execResult;
  return stdout.toString().trim();
};

const getVersion = () => {
  const tag = getAsString(exec("git", ["describe", "--tags", "--abbrev=0"]));
  const commits = getAsString(
    exec("git", ["rev-list", `${tag}..HEAD`, "--count"])
  );
  return `${tag}.${commits.trim()}`;
};

const run = () => {
  const version = getVersion();
  // Write the version file
  fs.writeFileSync(
    "src/version.ts",
    `export const version = '${version}';\n`,
    "utf-8"
  );
};

run();
