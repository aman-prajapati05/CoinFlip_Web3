// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CoinFlip {
    uint256 public constant MINIMUM_BET = 1e15; // 0.001 ETH
    address public owner;
    uint256 private nonce;

    event CoinFlipped(address player, uint256 amount, bool choice, bool result);

    constructor() {
        owner = msg.sender;
    }

    function flip(bool _choice) external payable {
        require(msg.value >= MINIMUM_BET, "Bet must be at least 0.001 ETH");
        require(address(this).balance >= msg.value * 2, "Contract doesn't have enough balance");

        bool result = generateRandomBool();
        
        if (result == _choice) {
            uint256 payout = msg.value * 2;
            (bool sent, ) = payable(msg.sender).call{value: payout}("");
            require(sent, "Failed to send Ether");
        }

        emit CoinFlipped(msg.sender, msg.value, _choice, result);
    }

    function generateRandomBool() private returns (bool) {
        uint256 randomNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))) % 100;
        nonce++;
        return randomNumber < 50;
    }

    receive() external payable {}

    function withdrawBalance() external {
        require(msg.sender == owner, "Only the owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool sent, ) = payable(owner).call{value: balance}("");
        require(sent, "Failed to send Ether");
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // New function to allow owner to add funds to the contract
    function addFunds() external payable {
        require(msg.sender == owner, "Only the owner can add funds");
    }
}