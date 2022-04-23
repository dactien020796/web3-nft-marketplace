// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Charm = await hre.ethers.getContractFactory("Charm");
  const charm = await Charm.deploy();
  await charm.deployed();
  console.log("Charm deployed to:", charm.address);

  const Petty = await hre.ethers.getContractFactory("Petty");
  const petty = await Petty.deploy();
  await petty.deployed();
  console.log("Petty deployed to:", petty.address);

  const Reserve = await hre.ethers.getContractFactory("Reserve");
  const reserve = await Reserve.deploy(charm.address);
  await reserve.deployed();
  console.log("Reserve deployed to:", reserve.address);

  const defaultFeeRate = 10;
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy(
    petty.address,
    defaultFeeRate,
    reserve.address
  );
  await marketplace.deployed();
  await marketplace.addPaymentToken(charm.address);
  console.log("Marketplace deployed to:", marketplace.address);

  console.log(
    `Charm is payment token: ${await marketplace.isPaymentTokenSupported(
      charm.address
    )}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
