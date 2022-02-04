const { extendEnvironment } = require("hardhat/config");
const { deploy, localContract } = require("./util");

require("./compile");
require("./test");

extendEnvironment(env => {
  env.web3 = require("@solana/web3.js");
  env.buf = env.bin = env.bufferLayout = require("@solana/buffer-layout");
  env.solidity = require("@solana/solidity");
  env.localContract = localContract.bind(null, env);
  env.deploy = deploy.bind(null, env);
});
