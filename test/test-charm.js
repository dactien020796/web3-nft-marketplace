/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Charm token test", function () {
    let [accountA, accountB, accountC] = [];
    let token;
    const amount = ethers.utils.parseUnits("100", "ether");
    const address0 = "0x0000000000000000000000000000000000000000";
    const totalSupply = ethers.utils.parseUnits("1000000", "ether");

    beforeEach(async () => {
        [accountA, accountB, accountC] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("Charm");
        token = await Token.deploy();
        await token.deployed();
    });

    describe("Common test", () => {
        it("Total supply should return correct value", async () => {
            expect(await token.totalSupply()).to.equal(totalSupply);
        });
        it("Balance of accountA should return correct value", async () => {
            expect(await token.balanceOf(accountA.address)).to.equal(totalSupply);
        });
        it("Balance of accountB should return correct value", async () => {
            expect(await token.balanceOf(accountB.address)).to.equal(0);
        });
    })

    describe("pause()", () => {
        it("Should exception if not contract owner", async () => {
            expect(token.connect(accountB).pause()).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Should exception if contract has been paused", async () => {
            await token.pause();
            expect(token.pause()).to.be.revertedWith("Pausable: paused");
        });
        it("Should pause successfully", async () => {
            await expect(token.pause())
                .to.emit(token, "Paused")
                .withArgs(accountA.address);
        });
    })

    describe("unpause()", () => {
        // TODO: Contract has been paused before all tests
        beforeEach(async () => {
            await token.pause();
        });

        it("Should exception if not contract owner", async () => {
            expect(token.connect(accountB).unpause()).to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Should exception if contract has been unpaused", async () => {
            await token.unpause();
            expect(token.unpause()).to.be.revertedWith("Pausable: unpaused");
        });
        it("Should unpause successfully", async () => {
            await expect(token.unpause())
                .to.emit(token, "Unpaused")
                .withArgs(accountA.address);
        });
    })

    describe("addToBlacklist()", () => {
        it("Should exception if add current sender to blacklist", async () => {
            expect(token.addToBlacklist(accountA.address))
                .to.be.revertedWith("Charm: Cannot add msg.sender to blacklist");
        });
        it("Should exception if not contract owner", async () => {
            expect(token.connect(accountB.address).addToBlacklist(accountA.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Should exception if account already on blacklist", async () => {
            await token.addToBlacklist(accountB.address);
            expect(token.addToBlacklist(accountB.address))
                .to.be.revertedWith("Charm: Account already on blacklist");
        });
        it("Should add to blacklist successfully", async () => {
            await expect(token.addToBlacklist(accountB.address))
                .to.emit(token, "BlacklistAdded")
                .withArgs(accountB.address);
        });
    })

    describe("removeFromBlacklist()", () => {
        // TODO: has some accounts on blacklists
        beforeEach(async () => {
            await token.addToBlacklist(accountB.address);
        });

        it("Should exception if not contract owner", async () => {
            expect(token.connect(accountB.address).removeFromBlacklist(accountA.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
        it("Should exception if account not on blacklist", async () => {
            expect(token.removeFromBlacklist(accountC.address))
                .to.be.revertedWith("Charm: Account not on blacklist");
        });
        it("Should remove from blacklist successfully", async () => {
            await expect(token.removeFromBlacklist(accountB.address))
                .to.emit(token, "BlacklistRemoved")
                .withArgs(accountB.address);
        });
    })
});
