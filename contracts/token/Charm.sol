//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract Charm is ERC20, Ownable, Pausable {
    mapping(address => bool) private _blackList;
    event BlacklistAdded(address account);
    event BlacklistRemoved(address account);

    constructor() ERC20("Charm", "CHM") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        require(
            _blackList[from] == false,
            "Charm: Account sender was on blacklist"
        );
        require(
            _blackList[to] == false,
            "Charm: Account recipient was on blacklist"
        );
        super._beforeTokenTransfer(from, to, amount);
    }

    function addToBlacklist(address _account) public onlyOwner {
        require(
            _account != msg.sender,
            "Charm: Cannot add msg.sender to blacklist"
        );
        require(
            _blackList[_account] == false,
            "Charm: Account already on blacklist"
        );
        _blackList[_account] = true;
        emit BlacklistAdded(_account);
    }

    function removeFromBlacklist(address _account) public onlyOwner {
        require(
            _blackList[_account] == true,
            "Charm: Account not on blacklist"
        );
        _blackList[_account] = false;
        emit BlacklistRemoved(_account);
    }
}
