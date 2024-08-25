"use client"
import React, { useState } from 'react'

const amountWithdraw = () => {
      const [walletAddress, setWalletAddress] = useState("");
      const withdrawTestnetFunds = async (contract, setTransactionStatus) => {
    if (!contract) {
      console.error("Contract not initialized");
      return;
    }
  
    try {
      setTransactionStatus("Initiating withdrawal...");
  
      // Get the current balance before withdrawal
      const initialBalance = await contract.getContractBalance();
      console.log("Initial contract balance:", ethers.utils.formatEther(initialBalance), "Sepolia ETH");
  
      // Call the withdrawBalance function
      const tx = await contract.withdrawBalance();
  
      setTransactionStatus("Withdrawal transaction sent. Waiting for confirmation...");
      console.log("Withdrawal transaction sent:", tx.hash);
  
      // Wait for the transaction to be mined
      const receipt = await tx.wait();
  
      console.log("Funds withdrawn successfully!", receipt.transactionHash);
      setTransactionStatus("Funds withdrawn successfully!");
  
      // Get the new contract balance (should be 0)
      const newBalance = await contract.getContractBalance();
      console.log("New contract balance:", ethers.utils.formatEther(newBalance), "Sepolia ETH");
  
      // Calculate and log the withdrawn amount
      const withdrawnAmount = initialBalance.sub(newBalance);
      console.log("Withdrawn amount:", ethers.utils.formatEther(withdrawnAmount), "Sepolia ETH");
  
      setTransactionStatus(`Withdrawn ${ethers.utils.formatEther(withdrawnAmount)} Sepolia ETH successfully!`);
    } catch (error) {
      console.error("Error withdrawing balance:", error);
      if (error.reason) {
        setTransactionStatus(`Error: ${error.reason}`);
      } else {
        setTransactionStatus("An error occurred while withdrawing funds. Please try again.");
      }
    }
  };
      const handleWithdrawTestnetFunds = async () => {
    if (confirm("Are you sure you want to withdraw all testnet funds from the contract?")) {
      await withdrawTestnetFunds(contract, setTransactionStatus);
    }
  };
  return (
    <div>amountWithdraw</div>
  )
}

export default amountWithdraw