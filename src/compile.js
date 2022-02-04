const { task } = require("hardhat/config");
const exec = require("util").promisify(require("child_process").exec);
const { solang, stash, sources } = require("./util");

task(
  "compile",
  "Compiles solang compatible Solidity to Solana artifacts"
).setAction(async (_, hre) => {
  const code = sources(hre).map(sourcePath => solang(hre, sourcePath));

  if (!code.length) throw Error("no source files found");

  await stash(hre);

  const jobs = await Promise.allSettled(code.map(line => exec(line)));

  const status = jobs.every(({ stdout, stderr, status }) => {
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return status === "fulfilled";
  });

  if (!status) throw Error("solang failed to compile some source files");

  console.log(`📦 Solana artifacts @ ${hre.config.paths.artifacts}`);
});
