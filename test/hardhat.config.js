require("hardhat-solang");

module.exports = {
  // don't pull solc
  solidity: undefined,
  // just use .defaultNetwork as .networks is absolutely ignored
  defaultNetwork: "localhost", // mainnet-beta, testnet, devnet
  paths: {
    sources: "./contracts",
    tests: ".",
    artifacts: "./artifacts",
  },
  solang: {
    // depicted values are defaults
    target: "solana", // solana, substrate, ewasm
    optLevel: "default", // none, less, default, aggressive
    noConstantFolding: false,
    noStrengthReduce: false,
    noDeadStorage: false,
    noVectorToSlice: false,
    mathOverflow: false,
    importMap: {
      /* openzeppelin: "./node_modules/@openzeppelin" */
    },
  },
};
