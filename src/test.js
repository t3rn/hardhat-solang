const { task } = require("hardhat/config");
const Mocha = require("mocha");
const { spinup, specs } = require("./util");

task(
  "test",
  "Spins up solana-test-validator and runs a test suite locally"
).setAction(async (args, hre) => {
  const spec = specs(hre, args.testFiles);

  if (!spec.length) throw Error("no tests found");

  await hre.run("compile");

  const solo = await spinup(hre);
  const mocha = new Mocha(hre.config.mocha);

  spec.forEach(testFile => mocha.addFile(testFile));
  const numFailures = await new Promise(resolve => mocha.run(resolve));

  solo.kill();
  mocha.dispose();

  if (numFailures) throw Error("hardhat-solang test suite failed");

  console.log(`✔️ hardhat-solang test suite`);
});
