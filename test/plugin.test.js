const { assert } = require("chai");
const {
  web3,
  bufferLayout,
  solidity,
  deploy,
  localContract,
} = require("hardhat");

describe("hardhat-solang runtime env ext", () => {
  let con;
  let alice;

  it("it should carry a @solana/web3.js export", () => {
    assert.isObject(web3);
  });

  it("it should carry a @solana/buffer-layout export", () => {
    assert.isObject(bufferLayout);
  });

  it("it should carry a @solana/solidity export", () => {
    assert.isObject(solidity);
  });

  it("it should allow connecting to the solana-test-validator", async () => {
    con = new web3.Connection("http://localhost:8899", "confirmed");
    const version = await con.getVersion();
    assert.isNumber(version["feature-set"]);
    assert.match(version["solana-core"], /^\d+\.\d+\.\d+$/);
  });

  it("it should airdrop some balance", async () => {
    alice = web3.Keypair.generate();
    const airdrop = await con.requestAirdrop(
      alice.publicKey,
      web3.LAMPORTS_PER_SOL
    );
    await con.confirmTransaction(airdrop);
  });

  it("should deploy 'bundle.so' to the localhost network", async () => {
    const programId = await deploy();
  });

  it("should load a solidity contract", async () => {
    ({ contract, storage } = await localContract("Escrow", "Escrow.abi"));
  });
});
