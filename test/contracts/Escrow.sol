// SPDX-License-Identifier: UNLICENSED
// solang ignores pragmas and supports struct abi transcoding out of the box
// moreover, solana balance is stored in a uint64

import "./IERC20.sol";

contract Escrow {
    // to save gas we hash the values
    mapping(bytes32 => bytes32) public active;

    modifier noDuplicateXtx(bytes32 xtxId) {
        require(active[xtxId] == bytes32(0), "Duplicate XTX ID");
        _;
    }

    event Execute(
        bytes32 xtxId,
        address executor,
        address to,
        address token,
        uint64 amount
    );
    event ExecuteRemoveLiquidity(
        bytes32 xtxId,
        address executor,
        address to,
        address tokenA,
        address tokenB,
        uint64 amountA,
        uint64 amountB
    );

    event Commit(bytes32 xtxId);
    event Revert(bytes32 xtxId);

    struct CircuitEvent {
        // assumption here is, that the circut will only emit a commit event,
        // if the amounts during execute are correct
        bytes32 xtxId;
        bool shouldCommit;
        // will need more fields for inclusion proof
    }

    // intializes escrowed token transfer, token swap or liquidity provision.
    // In all three cases contract is holding the token to receive until commit
    function execute(
        bytes32 xtxId,
        address to,
        address token,
        uint64 amount
    ) external noDuplicateXtx(xtxId) {
        _collect(amount, token);
        active[xtxId] = keccak256(
            abi.encodePacked(xtxId, msg.sender, to, token, amount)
        );
        emit Execute(xtxId, msg.sender, to, token, amount);
    }

    // settles token transaction (transfer, swap or addLiquidity)
    function settle(
        CircuitEvent memory evnt,
        address to,
        address token,
        uint64 amount
    ) external {
        // verify finality of CircuitEvent here. See `_verifyFinality()`

        require(
            keccak256(
                abi.encodePacked(evnt.xtxId, msg.sender, to, token, amount)
            ) == active[evnt.xtxId],
            "False inputs passed"
        );

        if (evnt.shouldCommit) {
            _send(to, token, amount);
            emit Commit(evnt.xtxId);
        } else {
            _send(payable(msg.sender), token, amount);
            emit Revert(evnt.xtxId);
        }

        delete active[evnt.xtxId];
    }

    // can be used for any pool, wont unwrap WETH though.
    // Do we want a version that unwraps WETH?
    function executeRemoveLiquidity(
        bytes32 xtxId,
        address to,
        address tokenA,
        address tokenB,
        uint64 amountA,
        uint64 amountB
    ) external noDuplicateXtx(xtxId) {
        require(_collect(amountA, tokenA), "tokenA couldn't be collected!");
        require(_collect(amountB, tokenB), "tokenB couldn't be collected!");
        active[xtxId] = keccak256(
            abi.encodePacked(
                xtxId,
                msg.sender,
                to,
                tokenA,
                tokenB,
                amountA,
                amountB
            )
        );
        emit ExecuteRemoveLiquidity(
            xtxId,
            msg.sender,
            to,
            tokenA,
            tokenB,
            amountA,
            amountB
        );
    }

    function settleRemoveLiquidity(
        CircuitEvent memory evnt,
        address to,
        address tokenA,
        address tokenB,
        uint64 amountA,
        uint64 amountB
    ) external {
        require(
            keccak256(
                abi.encodePacked(
                    evnt.xtxId,
                    msg.sender,
                    to,
                    tokenA,
                    tokenB,
                    amountA,
                    amountB
                )
            ) == active[evnt.xtxId],
            "False inputs passed"
        );

        if (evnt.shouldCommit) {
            _send(to, tokenA, amountA);
            _send(to, tokenB, amountB);
            emit Commit(evnt.xtxId);
        } else {
            _send(payable(msg.sender), tokenA, amountA);
            _send(payable(msg.sender), tokenB, amountB);
            emit Revert(evnt.xtxId);
        }

        delete active[evnt.xtxId];
    }

    function _send(
        address to,
        address token,
        uint64 amount
    ) private {
        IERC20(token).transfer(to, amount);
    }

    function _collect(uint64 amount, address token) private returns (bool) {
        // escrow contract needs to be approved before
        // This is how erc20 tokens are sent to smart contracts ->
        // Approve contract as spender, then transferFrom to contract address.
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        return true;
    }
}