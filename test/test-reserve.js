/* eslint-disable no-undef */
/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reserve", function () {
    let [admin, receiver, seller, buyer] = []
    let charm
    let reserve
    let address0 = "0x0000000000000000000000000000000000000000"
    let reserveBalance = ethers.utils.parseEther("1000")
    let oneWeek = 86400 * 7
    beforeEach(async () => {
        [admin, receiver, seller, buyer] = await ethers.getSigners();
        const Charm = await ethers.getContractFactory("Charm");
        charm = await Charm.deploy()
        await charm.deployed()
        const Reserve = await ethers.getContractFactory("Reserve");
        reserve = await Reserve.deploy(charm.address)
    })
    describe("withdrawTo", function () {
        beforeEach(async () => {
            await charm.transfer(reserve.address, reserveBalance)
        })
        it("should revert if not owner", async function () {
            await expect(reserve.connect(receiver)
                .withdrawTo(receiver.address, reserveBalance))
                .to.be.revertedWith("Ownable: caller is not the owner")
        });
        it("should revert if not exceed unlock time", async function () {
            await expect(reserve.withdrawTo(receiver.address, reserveBalance))
                .to.be.revertedWith("Reserve: Can Not Trade")
        });
        it("should revert if to is address 0", async function () {
            await network.provider.send("evm_increaseTime", [oneWeek * 24])

            await expect(reserve.withdrawTo(address0, reserveBalance))
                .to.be.revertedWith("Reserve: transfer to zero address")
        });
        it("should revert if exceed contract balance", async function () {
            await network.provider.send("evm_increaseTime", [oneWeek * 24])
            await expect(reserve.withdrawTo(receiver.address, reserveBalance + 1))
                .to.be.revertedWith("Reserve: exceeds contract balance")
        });
        it("should withdraw correctly", async function () {
            await network.provider.send("evm_increaseTime", [oneWeek * 24])
            expect(await charm.balanceOf(reserve.address)).to.be.equal(reserveBalance)
            await reserve.withdrawTo(receiver.address, reserveBalance)
            expect(await charm.balanceOf(reserve.address)).to.be.equal(0)
        });
    })
    describe("Combined with contract marketplace", function () {
        it("should withdraw correctly with fee from marketplace", async function () {
            let defaulFeeRate = 10
            let feeRecipientAddress = reserve.address
            let defaulPrice = ethers.utils.parseEther("100")
            let defaulBalance = ethers.utils.parseEther("10000")

            // Deploy Petty contract
            const Petty = await ethers.getContractFactory("Petty");
            petty = await Petty.deploy()
            await petty.deployed()

            // Deploy Marketplace contract
            const Marketplace = await ethers.getContractFactory("NFTMarketplace");
            marketplace = await Marketplace
                .deploy(petty.address, defaulFeeRate, feeRecipientAddress)
            await marketplace.deployed()

            // Prepare pre-condition data for seller
            await charm.transfer(buyer.address, defaulBalance)
            await marketplace.addPaymentToken(charm.address)
            await petty.mint(seller.address)
            await petty.connect(seller).setApprovalForAll(marketplace.address, true)
            await marketplace.connect(seller).addOrder(1, charm.address, defaulPrice)
            // Prepare pre-condition data for buyer
            await charm.connect(buyer).approve(marketplace.address, defaulPrice)
            await marketplace.connect(buyer).executeOrder(1)

            const reserveBalanceFee = defaulPrice.mul(defaulFeeRate).div(100)
            await network.provider.send("evm_increaseTime", [oneWeek * 24])
            expect(await charm.balanceOf(reserve.address)).to.be.equal(reserveBalanceFee)
            await reserve.withdrawTo(admin.address, reserveBalanceFee)
            expect(await charm.balanceOf(reserve.address)).to.be.equal(0)
        });
    })
})