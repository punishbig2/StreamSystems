const path = require("path");
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
  const buildPath = path.join(__dirname, "..", "build");
  if (!fs.existsSync(buildPath)) {
    console.log(`sorry but '${buildPath}' must exist`);
    process.exit(2);
  }
  const version = getVersion();
  // Write the version file
  fs.writeFileSync(`${buildPath}/current-version`, version, "utf-8");
};

run();
