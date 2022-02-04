#!/bin/bash

set -eEu

install_llvm() {
  curl -sSfL \
    -o /usr/local/lib/llvm12.0.tar.xz \
    https://github.com/hyperledger-labs/solang/releases/download/v0.1.9/llvm12.0-linux-x86-64.tar.xz
  cd /usr/local/lib/
  tar Jxf llvm12.0.tar.xz
  rm llvm12.0.tar.xz
  touch $HOME/.bashrc
  echo 'export "PATH=/usr/local/lib/llvm12.0/bin:$PATH"' >> $HOME/.bashrc
  echo 'export LLVM_SYS_120_PREFIX=/usr/local/lib/llvm12.0' >> $HOME/.bashrc
}

install_solang() {
  curl -sSfL \
    -o /usr/local/bin/solang \
    https://github.com/hyperledger-labs/solang/releases/download/v0.1.9/solang-linux
  chmod +x /usr/local/bin/solang
}

install_solana_test_validator() {
  sh -c "$(curl -sSfL https://release.solana.com/v1.9.5/install)"
}

case "$(uname -s)" in
  Linux*)
    echo "installing /usr/local/lib/llvm12.0 and /usr/local/bin/solang ..."
    install_llvm
    install_solang
    install_solana_test_validator
    ;;
  *)
    echo "not auto installing non npm dependencies on $(uname -s)"
    echo 'make sure llvm, solang and solana-test-validator are in your $PATH'
    ;;
esac