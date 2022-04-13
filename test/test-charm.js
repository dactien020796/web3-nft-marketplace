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

    // describe("pause()", () => {
    //     it("Should exception if not contract owner", async () => {

    //     });
    //     it("Should exception if contract has been paused", async () => {

    //     });
    //     it("Should pause successfully", async () => {

    //     });
    // })

    // describe("unpause()", () => {
    //     // TODO: Contract has been paused before all tests
    //     it("Should exception if not contract owner", async () => {

    //     });
    //     it("Should exception if contract has been unpaused", async () => {

    //     });
    //     it("Should unpause successfully", async () => {

    //     });
    // })

    // describe("addToBlacklist()", () => {
    //     it("Should exception if add current sender to blacklist", async () => {

    //     });
    //     it("Should exception if not contract owner", async () => {

    //     });
    //     it("Should exception if account already on blacklist", async () => {

    //     });
    //     it("Should add to blacklist successfully", async () => {

    //     });
    // })

    // describe("removeFromBlacklist()", () => {
    //     // TODO: has some accounts on blacklists
    //     it("Should exception if remove current sender to blacklist", async () => {

    //     });
    //     it("Should exception if not contract owner", async () => {

    //     });
    //     it("Should exception if account not on blacklist", async () => {

    //     });
    //     it("Should remove from blacklist successfully", async () => {

    //     });
    // })
});
