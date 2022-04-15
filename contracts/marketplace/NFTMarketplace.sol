//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract NFTMarketplace is Ownable {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Order {
        address seller;
        address buyer;
        uint256 nftId;
        address paymentToken;
        uint256 price;
    }

    Counters.Counter private _orderIdCount;
    mapping(uint256 => Order) public orders;
    IERC721 public nftContract;
    uint256 public feeRate = 1 ether;
    address public feeRecipient;
    EnumerableSet.AddressSet private _supportedPaymentTokens;

    /*
     * Events
     */
    event OrderAdded(
        uint256 orderId,
        address seller,
        uint256 nftId,
        address paymentToken,
        uint256 price
    );
    event OrderCancelled(uint256 orderId);
    event OrderMatched(
        uint256 orderId,
        address seller,
        address buyer,
        uint256 nftId,
        address paymentToken,
        uint256 price
    );

    constructor(
        address _nftAddress,
        uint256 _feeRate,
        address _feeRecipient
    ) {
        require(
            _nftAddress != address(0),
            "NFTMarketplace: nftAddress_ is zero address"
        );
        require(
            _feeRecipient != address(0),
            "NFTMarketplace: feeRecipient_ is zero address"
        );
        nftContract = IERC721(_nftAddress);
        _updateFeeRecipientAddress(_feeRecipient);
        _updateFeeRate(_feeRate);
        //feeDecimal = feeDecimal_;
        //feeRate = _feeRate;
    }

    /*
     * Fee related method
     */
    function updateFeeRecipientAddress(address _newRecipient)
        external
        onlyOwner
    {
        _updateFeeRecipientAddress(_newRecipient);
    }

    function updateFeeRate(uint256 _newFeeRate) external onlyOwner {
        _updateFeeRate(_newFeeRate);
    }

    function isSeller(uint256 _orderId, address _seller)
        public
        view
        returns (bool)
    {
        return orders[_orderId].seller == _seller;
    }

    /*
     * Payment token related method
     */
    function addPaymentToken(address _paymentToken) external onlyOwner {
        require(
            _paymentToken != address(0),
            "NFTMarketplace: _paymentToken is zero address"
        );
        require(_supportedPaymentTokens.add(_paymentToken));
    }

    function isPaymentTokenSupported(address _paymentToken)
        public
        view
        returns (bool)
    {
        return _supportedPaymentTokens.contains(_paymentToken);
    }

    modifier onlySupportedPaymentToken(address _paymentToken) {
        require(
            isPaymentTokenSupported(_paymentToken),
            "NFTMarketplace: unsupported payment token"
        );
        _;
    }

    /*
     * Order related method
     */
    function addOrder(
        uint256 _nftId,
        address _paymentToken,
        uint256 _price
    ) public onlySupportedPaymentToken(_paymentToken) {
        require(
            nftContract.ownerOf(_nftId) == msg.sender,
            "NFTMarketplace: sender is not owner of token"
        );
        require(
            nftContract.getApproved(_nftId) == address(this) ||
                nftContract.isApprovedForAll(msg.sender, address(this)),
            "NFTMarketplace: the contract is unauthorized to manage this token"
        );
        _orderIdCount.increment();
        uint256 orderId = _orderIdCount.current();
        orders[orderId] = Order(
            msg.sender,
            address(0),
            _nftId,
            _paymentToken,
            _price
        );
        nftContract.transferFrom(msg.sender, address(this), _nftId);
        emit OrderAdded(orderId, msg.sender, _nftId, _paymentToken, _price);
    }

    function cancelOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(
            order.buyer == address(0),
            "NFTMarketplace: buyer must be zero"
        );
        require(
            isSeller(_orderId, msg.sender),
            "NFTMarketplace: must be owner"
        );
        nftContract.transferFrom(address(this), msg.sender, order.nftId);
        delete orders[_orderId];
        emit OrderCancelled(_orderId);
    }

    function executeOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.price > 0, "NFTMarketplace: order has been canceled");
        require(
            order.buyer == address(0),
            "NFTMarketplace: buyer must be zero"
        );
        require(
            !isSeller(_orderId, msg.sender),
            "NFTMarketplace: must be owner"
        );

        uint256 feeAmount = _calculateFee(_orderId);
        if (feeAmount > 0) {
            IERC20(order.paymentToken).transferFrom(
                msg.sender,
                feeRecipient,
                feeAmount
            );
        }
        IERC20(order.paymentToken).transferFrom(
            msg.sender,
            order.seller,
            order.price - feeAmount
        );
        nftContract.transferFrom(address(this), msg.sender, order.nftId);
        emit OrderMatched(
            _orderId,
            order.seller,
            msg.sender,
            order.nftId,
            order.paymentToken,
            order.price
        );
    }

    function _updateFeeRecipientAddress(address _newRecipient) internal {
        require(
            _newRecipient != address(0),
            "NFTMarketplace: _newRecipient is zero address"
        );
        feeRecipient = _newRecipient;
    }

    function _updateFeeRate(uint256 _newFeeRate) internal {
        require(_newFeeRate < 100, "NFTMarketplace: bad fee rate");
        feeRate = _newFeeRate;
    }

    function _calculateFee(uint256 _orderId) private view returns (uint256) {
        if (feeRate == 0) {
            return 0;
        }
        Order storage order = orders[_orderId];
        return (order.price / 100) * feeRate;
    }
}
