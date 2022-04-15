/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
/* eslint-disable no-unused-vars */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("marketplace", function () {
    let [admin, seller, buyer, feeRecipient, samplePaymentToken] = []
    let petty
    let charm
    let marketplace
    let defaulFeeRate = 10
    let defaulPrice = ethers.utils.parseEther("100")
    let defaulBalance = ethers.utils.parseEther("10000")
    let address0 = "0x0000000000000000000000000000000000000000"
    beforeEach(async () => {
        [admin, seller, buyer, feeRecipient, samplePaymentToken] = await ethers.getSigners();
        const Petty = await ethers.getContractFactory("Petty");
        petty = await Petty.deploy()
        await petty.deployed()
        const Charm = await ethers.getContractFactory("Charm");
        charm = await Charm.deploy()
        await charm.deployed()
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await Marketplace.deploy(petty.address, defaulFeeRate, feeRecipient.address)
        await marketplace.deployed()
        await marketplace.addPaymentToken(charm.address)
        await charm.transfer(seller.address, defaulBalance)
        await charm.transfer(buyer.address, defaulBalance)
    })
    describe("common", function () {
        it("feeDecimal should return correct value", async function () {
        });
        it("feeRate should return correct value", async function () {
        });
        it("feeRecipient should return correct value", async function () {
        });
    })
    describe("updateFeeRecipient", function () {
        it("should revert if feeRecipient is address 0", async function () {
        });
        it("should revert if sender isn't contract owner", async function () {
        });
        it("should update correctly", async function () {
        });
    })

    describe("updateFeeRate", function () {
        it("should revert if fee rate >= 10^(feeDecimal+2)", async function () {
        });
        it("should revert if sender isn't contract owner", async function () {
        });
        it("should update correctly", async function () {
        });
    })
    describe("addPaymentToken", function () {
        it("should revert paymentToken is Address 0", async function () {
        });
        it("should revert if address is already supported", async function () {
        });
        it("should revert if sender is not contract owner", async function () {
        });
        it("should add payment token correctly", async function () {
        });
    })
    // important
    describe("addOrder", function () {
        beforeEach(async () => {
            await petty.mint(seller.address)
        })
        it("should revert if payment token not supported", async function () {
        });
        it("should revert if sender isn't nft owner", async function () {
        });
        it("should revert if nft hasn't been approve for marketplace contract", async function () {
        });
        it("should revert if price = 0", async function () {
        });
        it("should add order correctly", async function () {
        });
    })
    describe("cancelOrder", function () {
        beforeEach(async () => {
            await petty.mint(seller.address)
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await marketplace.connect(seller).addOrder(1, charm.address, defaulPrice)
        })
        it("should revert if order has been sold", async function () {
        });
        it("should revert if sender isn't order owner", async function () {
        });
        it("should cancel correctly", async function () {
        });
    })
    describe("executeOrder", function () {
        beforeEach(async () => {
            await petty.mint(seller.address)
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await marketplace.connect(seller).addOrder(1, charm.address, defaulPrice)
            await charm.connect(buyer).approve(marketplace.address, defaulPrice)
        })
        it("should revert if sender is seller", async function () {
        });
        it("should revert if order has been sold", async function () {
        });
        it("should revert if order has been cancel", async function () {
        });
        it("should execute order correctly with default fee", async function () {
        });
        it("should execute order correctly with 0 fee", async function () {
        });
        it("should execute order correctly with fee 1 = 99%", async function () {
        });
        it("should execute order correctly with fee 2 = 10.11111%", async function () {
        });
    })
})