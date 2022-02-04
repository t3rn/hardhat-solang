const { spawn } = require("child_process");
const { mkdir } = require("fs/promises");
const { isAbsolute, join, resolve: pathResolve } = require("path");
const { sync: glob } = require("fast-glob");
const exec = require("util").promisify(require("child_process").exec);
const {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  BpfLoader,
  BPF_LOADER_PROGRAM_ID,
} = require("@solana/web3.js");
const { Contract } = require("@solana/solidity");
const { readFile, writeFile } = require("fs/promises");

const NETWORKS = new Set(["mainnet-beta", "testnet", "devnet", "localhost"]);

module.exports = {
  deploy,
  solang,
  stash,
  sources,
  spinup,
  specs,
  localContract,
};

async function deploy(
  hre,
  filename,
  network,
  keypath,
  signer = "",
  airdrop = 419
) {
  filename = filename || "bundle.so";
  network = network || hre.defaultNetwork || "localhost";

  if (!NETWORKS.has(network)) throw Error("unsupported network");

  filename = filename.endsWith(".so") ? filename : `${filename}.so`;
  const filepath = isAbsolute(filename)
    ? filename
    : join(hre.config.paths.artifacts, filename);

  let cmd = await exec(
    "solana airdrop " +
      "--commitment confirmed " +
      `-u ${network === "localhost" ? "http://localhost:8899" : network} ` +
      `${keypath ? `-k ${keypath} ` : ""}` +
      "--output json " +
      `${airdrop} ` +
      `${keypath ? `-k ${keypath} ` : ""}`
  );

  if (cmd.stderr) throw cmd.stderr;

  cmd = await exec(
    "solana deploy " +
      "--commitment confirmed " +
      `-u ${network === "localhost" ? "http://localhost:8899" : network} ` +
      `${keypath ? `-k ${keypath} ` : ""}` +
      "--output json " +
      `${filepath} ` +
      `${signer}`
  );

  if (cmd.stderr) throw cmd.stderr;

  return JSON.parse(cmd.stdout).programId;
}

function solang(hre, sourcePath) {
  const {
    target = "solana",
    optLevel = "default",
    noConstantFolding = false,
    noStrengthReduce = false,
    noDeadStorage = false,
    noVectorToSlice = false,
    mathOverflow = false,
    importMap = {},
  } = hre.config.solang;

  const importMappings = Object.entries(importMap)
    .map(([k, v]) => `-m ${k}=${v} `)
    .join("");

  return (
    "solang " +
    (noConstantFolding ? "--no-constant-folding " : "") +
    (noStrengthReduce ? "--no-strength-reduce " : "") +
    (noDeadStorage ? "--no-dead-storage " : "") +
    (noVectorToSlice ? "--no-vector-to-slice " : "") +
    (mathOverflow ? "--math-overflow " : "") +
    importMappings +
    `-O ${optLevel} ` +
    `-I ${hre.config.paths.sources} ` +
    `-o ${hre.config.paths.artifacts} ` +
    `${sourcePath} ` +
    `--target ${target}`
  );
}

async function stash(hre) {
  await mkdir(hre.config.paths.artifacts, { recursive: true });
}

function sources(hre) {
  return glob([join(hre.config.paths.sources, "**/*.sol")], {
    deep: 419,
    ignore: ["**/node_modules"],
    absolute: true,
  });
}

function spinup(_hre) {
  return new Promise((resolve, reject) => {
    const solo = spawn("solana-test-validator");
    solo.stderr.on("data", chunk => reject(chunk.toString()));
    solo.stdout.on("data", function ondata(msg) {
      if (/JSON RPC URL: http:\/\/127.0.0.1:8899+/.test(msg)) {
        solo.stdout.removeListener("data", ondata);
        resolve(solo);
      }
    });
  });
}

function specs(hre, testFiles) {
  return testFiles.length
    ? testFiles.map(pathResolve)
    : glob(
        [
          join(hre.config.paths.tests, "**/*.test.js"),
          join(hre.config.paths.tests, "**/*.test.ts"),
        ],
        { deep: 419, ignore: ["**/node_modules"], absolute: true }
      );
}

///////////////////////////////////////////////////////////////////////////////
// FROM hyperledger-labs/solang/blob/main/integration/solana/setup.ts        //
///////////////////////////////////////////////////////////////////////////////

let ranLocalSetup = false;

async function localContract(
  hre,
  name,
  abifile,
  args = [],
  space = 8192,
  url = "http://localhost:8899"
) {
  if (!ranLocalSetup) await localSetup(hre);

  const abi = JSON.parse(
    await readFile(join(hre.config.paths.artifacts, abifile))
  );
  const payer = await load_key(join(hre.config.paths.tests, ".payer.key"));
  const program = await load_key(join(hre.config.paths.tests, ".program.key"));
  const storage = Keypair.generate();
  const connection = new Connection(url, "confirmed");

  const contract = new Contract(
    connection,
    program.publicKey,
    storage.publicKey,
    abi,
    payer
  );

  await contract.deploy(name, args, program, storage, space);

  return { contract, connection, payer, program, storage };
}

// export async function load2ndContract(connection, program, payerAccount, name, abifile, args = [], space= 8192) {
//   const abi = JSON.parse(readFileSync(abifile, 'utf8'));
//   const storage = Keypair.generate();
//   const contract = new Contract(connection, program.publicKey, storage.publicKey, abi, payerAccount);
//   await contract.deploy(name, args, program, storage, space);
//   return contract;
// }

async function load_key(filename) {
  const contents = await readFile(filename, { encoding: "utf8" });
  const bs = Uint8Array.from(contents.split(",").map(v => Number(v)));
  return Keypair.fromSecretKey(bs);
}

async function newAccountWithLamports(connection) {
  const account = Keypair.generate();
  let signature = await connection.requestAirdrop(
    account.publicKey,
    LAMPORTS_PER_SOL
  );
  await connection.confirmTransaction(signature, "confirmed");
  return account;
}

async function localSetup(hre) {
  const connection = new Connection("http://localhost:8899", "confirmed");
  const payer = await newAccountWithLamports(connection);
  const program = Keypair.generate();

  await BpfLoader.load(
    connection,
    payer,
    program,
    await readFile(join(hre.config.paths.artifacts, "bundle.so")),
    BPF_LOADER_PROGRAM_ID
  );

  await writeFile(
    join(hre.config.paths.tests, ".payer.key"),
    String(payer.secretKey)
  );
  await writeFile(
    join(hre.config.paths.tests, ".program.key"),
    String(program.secretKey)
  );

  ranLocalSetup = true;
}
