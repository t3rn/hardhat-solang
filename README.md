# hardhat-solang

<span class="badge-npmversion"><a href="https://npmjs.org/package/hardhat-solang" title="view hardhat-solang on npm"><img src="https://img.shields.io/npm/v/hardhat-solang.svg" alt="npm version" /></a></span> <span class="badge-npmdownloads"><a href="https://npmjs.org/package/hardhat-solang" title="View hardhat-solang on npm"><img src="https://img.shields.io/npm/dm/hardhat-solang.svg" alt="npm downloads" /></a></span>

A [`hardhat`](https://github.com/nomiclabs/hardhat) plugin using [`solang`](https://github.com/hyperledger-labs/solang) instead of `solc` targeting solana and running tests against a [`solana-test-validator`](https://docs.solana.com/developing/test-validator).

```nofmt
npm i t3rn/hardhat-solang @solana/web3.js @solana/solidity @solana/buffer-layout fast-glob
```

> `@solana/web3.js`, `@solana/solidity`, `@solana/buffer-layout`, `fast-glob`, and `hardhat` are peer dependencies

<!-- On linux a matching `llvm`, `solang`, and `solana-test-validator` are set up in a post install script, on other platforms you must [install them manually](https://solang.readthedocs.io/en/latest/installing.html). -->

Make sure to manually install `llvm`, `solang`, `solana-test-validator` and `solana`, and put them on your `$PATH`:

+ [install `llvm + solang`](https://solang.readthedocs.io/en/latest/installing.html)

+ [install `solana + solana-test-validator`](https://docs.solana.com/cli/install-solana-cli-tools)

## Usage

### `hardhat.config.js`

```js
require("hardhat-solang");

module.exports = {
  // don't pull solc
  solidity: undefined,
  // just use .defaultNetwork as .networks is absolutely ignored
  defaultNetwork: "localhost", // mainnet-beta, testnet, devnet
  paths: {
    sources: "./contracts",
    tests: "./contracts",
    artifacts: "./artifacts",
  },
  solang: { // depicted values are defaults
    target: "solana", // solana, substrate, ewasm
    optLevel: "default", // none, less, default, aggressive
    noConstantFolding: false,
    noStrengthReduce: false,
    noDeadStorage: false,
    noVectorToSlice: false,
    mathOverflow: false, // enable math overflow checks
    importMap: { /* openzeppelin: "./node_modules/@openzeppelin" */ }
  }
};
```

### Tasks

#### `hardhat compile`

Compiles any `.sol` contracts with `solang`.

#### `hardhat test`

Runs tests against a `solana-test-validator`.

### Hardhat Runtime Environment

Within your tests and scripts you can do sth like:

```js
let { web3, solidity, bufferLayout, deploy } = require("hardhat");
```

`web3`: `@solana/web3.js` default export

`solidity`: `@solana/solidity` default export

`bufferLayout`: `@solana/buffer-layout` default export

```js
let { contract, connection, payer, program, storage } = await localContract(
  name,
  abifile,
  args = [],
  space = 8192,
  url = "http://localhost:8899",
)
```

Deploys given contract locally returning a `.contract` object that is more familiar coming from ethereum land.

```js
let programId = await deploy(
  filename, // "bundle.so"
  network, // "localhost"
  keypath, // ""
  signer, // ""
  airdrop // 419
)
```

Deploys a program off of the shared object `filename` from your artifacts. All params are optional, so that you can just do `await deploy()`.

> [./test/plugin.test.js](./test/plugin.test.js) might serve as a little example

## License

[WTFPL](https://spdx.org/licenses/WTFPL.html)