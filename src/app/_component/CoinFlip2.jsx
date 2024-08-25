"use client"
import React, { useState, useEffect, useRef } from 'react';
import Lottie from 'react-lottie';
import animationData from '../lottiie/coin.json';
import { SiEthereum } from "react-icons/si";
import { ethers } from 'ethers';
import CoinFlipABI from './CoinFlip.json';
import Confetti from 'react-confetti';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
require("dotenv").config();

const CONTRACT_ADDRESS = '0xb080aB7fcB00C430bA828503c307a514A759481F';
const SEPOLIA_CHAIN_ID = 11155111;
const MINIMUM_BALANCE = ethers.utils.parseEther("0.01");
const MINIMUM_BET = ethers.utils.parseEther("0.001");

const CoinFlip = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [contract, setContract] = useState(null);
  const [betAmount, setBetAmount] = useState("0.001");
  const [potentialWinnings, setPotentialWinnings] = useState("0.002");
  const [transactions, setTransactions] = useState([]);
  const [houseBalance, setHouseBalance] = useState("0");
  const [userBalance, setUserBalance] = useState("0");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const lottieRef = useRef();

  const darkTheme = {
    background: '#333',
    text: '#fff',
    success: '#04691a',
    error: '#881aa9',
    warning: '#f1c40f',
    info: '#3498db'
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };

  const customToast = (message, type = 'default') => {
    const toastOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      style: {
        background: darkTheme.background,
        color: darkTheme.text,
      },
    };

    switch (type) {
      case 'success':
        toast.success(message, {...toastOptions, style: {...toastOptions.style, borderLeft: `4px solid ${darkTheme.success}`}});
        break;
      case 'error':
        toast.error(message, {...toastOptions, style: {...toastOptions.style, borderLeft: `4px solid ${darkTheme.error}`}});
        break;
      case 'warn':
        toast.warn(message, {...toastOptions, style: {...toastOptions.style, borderLeft: `4px solid ${darkTheme.warning}`}});
        break;
      case 'info':
        toast.info(message, {...toastOptions, style: {...toastOptions.style, borderLeft: `4px solid ${darkTheme.info}`}});
        break;
      default:
        toast(message, toastOptions);
    }
  };


  const updateBalances = async (contractInstance, signer) => {
    try {
      const houseBalanceWei = await contractInstance.getContractBalance();
      setHouseBalance(ethers.utils.formatEther(houseBalanceWei));

      const address = await signer.getAddress();
      const userBalanceWei = await signer.provider.getBalance(address);
      setUserBalance(ethers.utils.formatEther(userBalanceWei));

      // Check if user balance is below minimum
      if (userBalanceWei.lt(MINIMUM_BALANCE)) {
        customToast("Your balance is below the minimum required (0.01 ETH). Please add funds to your wallet..", 'warn');
      }
    } catch (error) {
      // console.error("Error updating balances:", error);
    }
  };

  const checkNetwork = async (provider) => {
    try {
      const network = await provider.getNetwork();
      // console.log("Current network:", network);
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        setIsCorrectNetwork(false);
        return false;
      }
      setIsCorrectNetwork(true);
      return true;
    } catch (error) {
      // console.error("Error checking network:", error);
      return false;
    }
  };

  useEffect(() => {
    const setupEventListener = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await checkNetwork(provider);

        window.ethereum.on('chainChanged', async (chainId) => {
          // console.log("Chain changed to:", chainId);
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const networkCorrect = await checkNetwork(provider);
          
          if (walletAddress) {
            if (!networkCorrect) {
              customToast("Please switch to the Sepolia network to use this application.", 'warn');
            } else {
              const signer = provider.getSigner();
              const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CoinFlipABI.abi, signer);
              setContract(contractInstance);
              updateBalances(contractInstance, signer);
            }
          }
        });

        window.ethereum.on('accountsChanged', async (accounts) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            const signer = provider.getSigner();
            if (isCorrectNetwork) {
              const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CoinFlipABI.abi, signer);
              setContract(contractInstance);
              updateBalances(contractInstance, signer);
            }
          } else {
            setWalletAddress("");
            setContract(null);
          }
        });

        return () => {
          window.ethereum.removeAllListeners('chainChanged');
          window.ethereum.removeAllListeners('accountsChanged');
        };
      }
    };

    setupEventListener();
  }, [walletAddress]);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        
        const isCorrectNetwork = await checkNetwork(provider);
        if (!isCorrectNetwork) {
          customToast("Please switch to the Sepolia network to use this application.", 'warn');
          return;
        }

        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);

        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CoinFlipABI.abi, signer);
        setContract(contractInstance);

        updateBalances(contractInstance, signer);
      } catch (error) {
        // console.error("Failed to connect wallet:", error);
        customToast("Failed to connect wallet. Please try again.", 'error');
      }
    } else {
      customToast("Please install a Web3 wallet like MetaMask!", 'error');
    }
  };

  const checkContractBalance = async () => {
    if (!contract) return;
    try {
      const balance = await contract.getContractBalance();
      const balanceInEther = ethers.utils.formatEther(balance);
      // console.log(`Contract balance: ${balanceInEther} ETH`);
      return balance;
    } catch (error) {
      // console.error("Error checking contract balance:", error);
      return null;
    }
  };

  const addTransaction = (amount, choice, win) => {
    const newTransaction = {
      timestamp: new Date().toLocaleString(),
      amount: amount,
      choice: choice,
      win: win
    };
    setTransactions(prevTransactions => [newTransaction, ...prevTransactions.slice(0, 9)]);
  };

  const placeBet = async (choice) => {
    if (!contract || !walletAddress) {
      customToast("Please connect your wallet first.", 'error');
      return;
    }
    
    if (!isCorrectNetwork) {
      customToast("Please switch to the Sepolia network before placing a bet.", 'warn');
      return;
    }
    
    try {
      const betAmountWei = ethers.utils.parseEther(betAmount);
  
      // Check if bet amount is less than the minimum bet
      if (betAmountWei.lt(MINIMUM_BET)) {
        customToast("Minimum bet amount is 0.01 ETH. Please increase your bet.", 'error');
        return;
      }
  
      const contractBalance = await checkContractBalance();
      if (!contractBalance) return; // Exit if there was an error checking the balance
      
      if (contractBalance.lt(betAmountWei.mul(2))) {
        customToast("The contract doesn't have enough balance to potentially pay out. Try a smaller bet.", 'error');
        return;
      }
  
      const userBalance = await contract.provider.getBalance(walletAddress);
      if (userBalance.lt(betAmountWei)) {
        customToast("You don't have enough balance to place this bet.", 'error');
        return;
      }
  
      setAnimationSpeed(2);
  
      const tx = await contract.flip(choice, {
        value: betAmountWei,
        gasLimit: 100000  // Adjust this value as needed
      });
      
      // console.log("Transaction sent:", tx.hash);
      setTransactionStatus("Transaction sent. Waiting for confirmation...");
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // console.log("Transaction confirmed:", receipt.transactionHash);
        setTransactionStatus("Bet placed successfully!");
        
        // Get the result of the flip from the event logs
        const flipEvent = receipt.events.find(event => event.event === "CoinFlipped");
        const result = flipEvent.args.result;
        const win = choice === result;
  
        // Add the transaction to the list
        addTransaction(betAmount, choice, win);
  
        // Update balances after bet
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        updateBalances(contract, signer);
  
        // Show celebration if won
        if (win) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 5000);
        }
      } else {
        // console.error("Transaction failed:", receipt);
        setTransactionStatus("Transaction failed. Please try again.");
        setAnimationSpeed(1);
        customToast("Transaction failed. Please try again.", 'error');
      }
    } catch (error) {
      // console.error("Error placing bet:", error);
      setAnimationSpeed(1);
    }
  };

  const handleBetAmountChange = (e) => {
    const amount = e.target.value;
    setBetAmount(amount);
    setPotentialWinnings((parseFloat(amount) * 2).toFixed(3));
  };

  return (
    <>
    
    <div className="flex flex-col min-h-screen bgcss relative p-4">
    {showCelebration && 
      <div className='w-screen h-screen absolute overflow-hidden'>
       <Confetti />
      </div>
     }
      <ToastContainer />
      
      <h1 className="md:text-[4vw] customFont text-[7vw] leading-[1] font-bold mb-8 text-white md:text-center">CoinFlip Game</h1>
      <div className="absolute top-4 right-4">
        {!walletAddress ? (
          <button onClick={connectWallet} className="bg-[#106956] hover:bg-[#332A36] text-white md:text-lg text-sm font-bold px-2 py-2 rounded">
            Connect Wallet
          </button>
        ) : (
          <span className="text-white font-semibold">
            {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
          </span>
        )}
      </div>      
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="w-72 h-52 items-center flex mb-4 bg-blak">
          <Lottie 
            options={defaultOptions}
            height={300}
            width={300}
            speed={animationSpeed}
            ref={lottieRef}
          />
        </div>
        <div className='flex flex-col items-center glasseffect lg:w-[40vw] sm:w-[80vw] sm:h-[50vw] md:w-[60vw] md:h-[40vw] w-[90vw] h-[80vw] lg:h-[20vw] justify-center rounded-3xl'>
          <div className="mb-4">
            <input
              type="number"
              step="0.001"
              min="0.001"
              value={betAmount}
              onChange={handleBetAmountChange}
              className=" text-purple-200 font-bold brightness-110 h-[10vw] sm:h-[6vw] md:h-[4vw] lg:h-[3vw] px-2 rounded-xl outline-none glass bg-opacity-25"
            />
            <span className="ml-[1vw] text-white">ETH</span>
          </div>
          <div className="mb-[1vw] text-white">
            Potential Winnings: {potentialWinnings} ETH
          </div>
          <div className="flex gap-3 mb-[1vw]">
            <button 
              onClick={() => placeBet(true)} 
              className=" hover:bg-[#04691a] glass text-white font-bold lg:text-[1.2vw]  py-2 px-4 rounded outline-none"
              disabled={!walletAddress}
            >
              Flip Heads
            </button>
            <button 
              onClick={() => placeBet(false)} 
              className=" hover:bg-[#881aa9] glass text-white font-bold py-2 px-4 lg:text-[1.2vw] rounded outline-none"
              disabled={!walletAddress}
            >
              Flip Tails
            </button>
          </div>
          <div className="flex flex-wrap flex-col md:flex-row items-center justify-center gap-2  text-white mb-8">
            <div className="flex items-center ">
              <SiEthereum className="text-xl md:text-2xl mr-2" />
              <span className="md:text-xl text-[#881aa9] font-extrabold">User: {parseFloat(userBalance).toFixed(4)} ETH</span>
            </div>
            <div className="flex items-center">
              <SiEthereum className="text-xl md:text-2xl  mr-2" />
              <span className="md:text-xl text-[#04691a] font-extrabold">House: {parseFloat(houseBalance).toFixed(4)} ETH</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-md lg:absolute flex flex-col bottom-10 ">
        <h2 className="md:text-[2vw] text-xl font-bold mb-4 text-white mt-8">Recent Transactions</h2>
        <ul className="bg-white bg-opacity-10 rounded p-2 text-sm md:text-[1vw]">
          {transactions.map((tx, index) => (
            <li key={index} className={`mb-1 ${tx.win ? 'text-green-400' : 'text-red-400'}`}>
              {tx.timestamp}: {tx.amount} ETH - {tx.choice ? 'Heads' : 'Tails'} - {tx.win ? 'Won 🎉' : 'Lost 😢'}
            </li>
          ))}
        </ul>
      </div>
    </div>
    </>
  );
};

export default CoinFlip;