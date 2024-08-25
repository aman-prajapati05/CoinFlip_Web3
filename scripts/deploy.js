const hre = require("hardhat");

async function main() {
  const CoinFlip = await hre.ethers.getContractFactory("CoinFlip");
  const coinFlip = await CoinFlip.deploy();

  await coinFlip.deployed();

  console.log("CoinFlip deployed to:", coinFlip.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });