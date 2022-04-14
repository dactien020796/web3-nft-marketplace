/* eslint-disable prefer-const */
/* eslint-disable no-unused-vars */
/* eslint-disable prettier/prettier */
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20-BEP20", function () {
    let [accountA, accountB, accountC] = [];
    let petty;
    let address0 = "0x0000000000000000000000000000000000000000";
    let uri = "sample-url.com/";
    beforeEach(async () => {
        [accountA, accountB, accountC] = await ethers.getSigners();
        const Petty = await ethers.getContractFactory("Petty");
        petty = await Petty.deploy();
        await petty.deployed();
    })

    describe("mint", function () {
        it("Should revert if mint to zero address", async function () {
            await expect(petty.mint(address0))
                .to.be.revertedWith("ERC721: mint to the zero address");
        });
        it("Should mint token successfully", async function () {
            const mintTx = await petty.mint(accountA.address);
            expect(mintTx).to.be.emit(petty, "Transfer").withArgs(address0, accountA.address, 1);
            expect(await petty.balanceOf(accountA.address)).to.be.equals(1);
            expect(await petty.ownerOf(1)).to.be.equals(accountA.address);

            const mintTx2 = await petty.mint(accountA.address);
            expect(mintTx2).to.be.emit(petty, "Transfer").withArgs(address0, accountA.address, 2);
            expect(await petty.balanceOf(accountA.address)).to.be.equals(2);
            expect(await petty.ownerOf(2)).to.be.equals(accountA.address);
        });
    })

    describe("updateBaseTokenURI", function () {
        it("Should update base token URI successfully", async function () {
            await petty.updateBaseTokenURI(uri);
            await petty.mint(accountA.address);
            expect(await petty.tokenURI(1)).to.be.equals(uri + "1");
        });
    })
});
