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
        const Marketplace = await ethers.getContractFactory("NFTMarketplace");
        marketplace = await Marketplace.deploy(petty.address, defaulFeeRate, feeRecipient.address)
        await marketplace.deployed()
        await marketplace.addPaymentToken(charm.address)
        await charm.transfer(seller.address, defaulBalance)
        await charm.transfer(buyer.address, defaulBalance)
    })
    describe("common", function () {
        it("feeRate should return correct value", async function () {
            expect(await marketplace.feeRate()).to.be.equal(defaulFeeRate)
        });
        it("feeRecipient should return correct value", async function () {
            expect(await marketplace.feeRecipient()).to.be.equal(feeRecipient.address)
        });
    })
    describe("updateFeeRecipient", function () {
        it("should revert if feeRecipient is address 0", async function () {
            expect(marketplace.updateFeeRecipientAddress(address0))
                .to.be.revertedWith("NFTMarketplace: _newRecipient is zero address");
        });
        it("should revert if sender isn't contract owner", async function () {
            expect(marketplace.connect(feeRecipient.address).updateFeeRecipientAddress(feeRecipient.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should update correctly", async function () {
            await marketplace.updateFeeRecipientAddress(seller.address);
            expect(await marketplace.feeRecipient()).to.be.equal(seller.address);
        });
    })

    describe("updateFeeRate", function () {
        it("should revert if fee rate < 100", async function () {
            expect(marketplace.updateFeeRate(200))
                .to.be.revertedWith("NFTMarketplace: bad fee rate");
        });
        it("should revert if sender isn't contract owner", async function () {
            expect(marketplace.connect(seller.address).updateFeeRate(200))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("should update correctly", async function () {
            await marketplace.updateFeeRate(20);
            expect(await marketplace.feeRate()).to.be.equal(20);
        });
    })
    describe("addPaymentToken", function () {
        it("should revert paymentToken is Address 0", async function () {
            await expect(marketplace.addPaymentToken(address0))
                .to
                .be
                .revertedWith("NFTMarketplace: _paymentToken is zero address")
        });
        it("should revert if address is already supported", async function () {
            await marketplace.addPaymentToken(samplePaymentToken.address)
            await expect(marketplace.addPaymentToken(samplePaymentToken.address))
                .to
                .be
                .revertedWith("NFTMarketplace: already supported")
        });
        it("should revert if sender is not contract owner", async function () {
            await expect(marketplace.connect(buyer)
                .addPaymentToken(samplePaymentToken.address))
                .to
                .be
                .revertedWith("Ownable: caller is not the owner")
        });
        it("should add payment token correctly", async function () {
            await marketplace.addPaymentToken(samplePaymentToken.address)
            expect(await marketplace.isPaymentTokenSupported(samplePaymentToken.address))
                .to.be.equal(true)
        });
    })
    describe("addOrder", function () {
        beforeEach(async () => {
            await petty.mint(seller.address)
        })
        it("should revert if payment token not supported", async function () {
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await expect(marketplace.connect(seller)
                .addOrder(1, samplePaymentToken.address, defaulPrice))
                .to
                .be
                .revertedWith("NFTMarketplace: unsupported payment token")
        });
        it("should revert if sender isn't nft owner", async function () {
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await expect(marketplace.connect(buyer)
                .addOrder(1, charm.address, defaulPrice))
                .to
                .be
                .revertedWith("NFTMarketplace: sender is not owner of token")
        });
        it("should revert if nft hasn't been approve for marketplace contract", async function () {
            await expect(marketplace.connect(seller)
                .addOrder(1, charm.address, defaulPrice))
                .to
                .be
                .revertedWith("NFTMarketplace: the contract is unauthorized to manage this token")
        });
        it("should revert if price = 0", async function () {
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await expect(marketplace.connect(seller)
                .addOrder(1, charm.address, 0))
                .to
                .be
                .revertedWith("NFTMarketplace: price must be greater than 0")
        });
        it("should add order correctly", async function () {
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            const addOrderTx = await marketplace.connect(seller)
                .addOrder(1, charm.address, defaulPrice)
            await expect(addOrderTx).to.be.emit(marketplace, "OrderAdded")
                .withArgs(1, seller.address, 1, charm.address, defaulPrice)
            expect(await petty.ownerOf(1)).to.be.equal(marketplace.address)
            await petty.mint(seller.address)
            const addOrderTx2 = await marketplace.connect(seller)
                .addOrder(2, charm.address, defaulPrice)
            await expect(addOrderTx2).to.be.emit(marketplace, "OrderAdded")
                .withArgs(2, seller.address, 2, charm.address, defaulPrice)
            expect(await petty.ownerOf(2)).to.be.equal(marketplace.address)
        });
    })
    describe("cancelOrder", function () {
        beforeEach(async () => {
            await petty.mint(seller.address)
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await marketplace.connect(seller).addOrder(1, charm.address, defaulPrice)
        })
        it("should revert if order has been sold", async function () {
            await charm.connect(buyer)
                .approve(marketplace.address, defaulPrice)
            await marketplace.connect(buyer).
                executeOrder(1)
            expect(await petty.ownerOf(1)).to.be.equal(buyer.address);
            await expect(marketplace.connect(seller).cancelOrder(1))
                .to.be.revertedWith("NFTMarketplace: buyer must be zero")
        });
        it("should revert if sender isn't order owner", async function () {
            await expect(marketplace.connect(buyer).cancelOrder(1))
                .to.be.revertedWith("NFTMarketplace: must be owner")
        });
        it("should cancel correctly", async function () {
            const cancelTx = await marketplace.connect(seller).cancelOrder(1)
            await expect(cancelTx).to.be.emit(marketplace, "OrderCancelled")
                .withArgs(1)
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
            await expect(marketplace.connect(seller).executeOrder(1))
                .to.be.revertedWith("NFTMarketplace: buyer must be different from seller")
        });
        it("should revert if order has been sold", async function () {
            await marketplace.connect(buyer).executeOrder(1)
            await expect(marketplace.connect(buyer).executeOrder(1))
                .to.be.revertedWith("NFTMarketplace: buyer must be zero")
        });
        it("should revert if order has been cancel", async function () {
            await marketplace.connect(seller).cancelOrder(1)
            await expect(marketplace.connect(buyer).executeOrder(1))
                .to.be.revertedWith("NFTMarketplace: order has been canceled")
        });
        it("should execute order correctly with default fee", async function () {
            const executeTx = await marketplace.connect(buyer).executeOrder(1)
            await expect(executeTx).to.be.emit(marketplace, "OrderMatched")
                .withArgs(1, seller.address, buyer.address, 1, charm.address, defaulPrice)
            expect(await petty.ownerOf(1)).to.be.equal(buyer.address)
            expect(await charm.balanceOf(seller.address))
                .to.be.equal(defaulBalance.add(defaulPrice.mul(90).div(100)))
            expect(await charm.balanceOf(buyer.address)).to.be.equal(defaulBalance.sub(defaulPrice))
            expect(await charm.balanceOf(feeRecipient.address)).to.be.equal(defaulPrice.mul(10).div(100))
        });
        it("should execute order correctly with 0 fee", async function () {
            await marketplace.updateFeeRate(0)
            const executeTx = await marketplace.connect(buyer).executeOrder(1)
            await expect(executeTx).to.be.emit(marketplace, "OrderMatched")
                .withArgs(1, seller.address, buyer.address, 1, charm.address, defaulPrice)
            expect(await petty.ownerOf(1)).to.be.equal(buyer.address)
            expect(await charm.balanceOf(seller.address)).to.be.equal(defaulBalance.add(defaulPrice))
            expect(await charm.balanceOf(buyer.address)).to.be.equal(defaulBalance.sub(defaulPrice))
            expect(await charm.balanceOf(feeRecipient.address)).to.be.equal(0)
        });
        it("should execute order correctly with fee 1 = 99%", async function () {
            await marketplace.updateFeeRate(99)
            const executeTx = await marketplace.connect(buyer).executeOrder(1)
            await expect(executeTx).to.be.emit(marketplace, "OrderMatched")
                .withArgs(1, seller.address, buyer.address, 1, charm.address, defaulPrice)
            expect(await petty.ownerOf(1)).to.be.equal(buyer.address)
            expect(await charm.balanceOf(seller.address)).to.be.equal(defaulBalance.add(defaulPrice.mul(1).div(100)))
            expect(await charm.balanceOf(buyer.address)).to.be.equal(defaulBalance.sub(defaulPrice))
            expect(await charm.balanceOf(feeRecipient.address)).to.be.equal(defaulPrice.mul(99).div(100))
        });
    })
})