// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract Exchange is Ownable {
   
    constructor() Ownable(msg.sender) {}

    struct Token{
        string symbolName;
        address erc20TokenAddress;

        mapping(uint=>OrderBook) buyOrderBook;
        mapping(uint=>OrderBook) sellOrderBook;

        uint currBuyPrice;
        uint lowestBuyPrice;
        uint amountBuyPrices;
       
        uint currSellPrice;
        uint highestSellPrice;  
        uint amountSellPrices;
    }

    struct Offer{
        uint amount;
        address who;
    }

    struct OrderBook{
        uint higherPrice;
        uint lowerPrice;

        mapping(uint=>Offer) offers;

        uint offers_key;
        uint offers_length;
    }

    mapping(uint8 => Token) tokens;
    uint8 SymbolNameIndex;

    // internal token custody: user => tokenIndex => amount
    mapping(address=>mapping(uint=>uint)) public tokenBalanceForAddress;

    // internal ETH custody (in wei): user => amount
    mapping(address=>uint) balanceETHForAddress;


    function depositEther() payable public {
        require(balanceETHForAddress[msg.sender] + msg.value >= balanceETHForAddress[msg.sender], "Overflow");
        balanceETHForAddress[msg.sender] += msg.value;
    }

    function withdrawEther(uint amount) public {
        require(balanceETHForAddress[msg.sender] >= amount, "Insufficient balance");
        balanceETHForAddress[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    function getEthBalance() public view returns(uint){
        return balanceETHForAddress[msg.sender];
    }


    function depositToken(string memory symbolName, uint amount) public  {
        require(hasToken(symbolName), "Token does not exist");

        uint8 index = getSymbolIndex(symbolName);

        address tokenAddress = tokens[index].erc20TokenAddress;

        require(tokenAddress != address(0), "Token address is zero");
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        require(tokenBalanceForAddress[msg.sender][index] + amount >= tokenBalanceForAddress[msg.sender][index], "Overflow");
        tokenBalanceForAddress[msg.sender][index] += amount;
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }

    function withdrawToken(string memory symbolName, uint amount) public {
        require(hasToken(symbolName), "Token does not exist");
        uint8 index = getSymbolIndex(symbolName);
        address tokenAddress = tokens[index].erc20TokenAddress;
        require(tokenAddress != address(0), "Token address is zero");
        IERC20 token = IERC20(tokenAddress);
        require(tokenBalanceForAddress[msg.sender][index] >= amount, "Insufficient token balance");
        tokenBalanceForAddress[msg.sender][index] -= amount;
        require(token.transfer(msg.sender, amount), "Transfer failed");
    }

    function getTokenBalance(string memory symbolName) public view returns(uint){
        require(hasToken(symbolName), "Token does not exist");
        uint8 index = getSymbolIndex(symbolName);
        return tokenBalanceForAddress[msg.sender][index];
    }

    function addToken(string memory symbolName, address erc20TokenAddress) public onlyOwner {
        require(!hasToken(symbolName), "Token already exists");
        tokens[SymbolNameIndex].symbolName = symbolName;
        tokens[SymbolNameIndex].erc20TokenAddress = erc20TokenAddress;
        SymbolNameIndex++;
    }

    // FIX: do not call getSymbolIndex (which reverts); do a safe loop
    function hasToken(string memory symbolName) public view returns(bool){
        bytes32 target = keccak256(abi.encodePacked(symbolName));
        for (uint8 i = 0; i < SymbolNameIndex; i++) {
            if (keccak256(abi.encodePacked(tokens[i].symbolName)) == target) {
                return true;
            }
        }
        return false;
    }

    function getSymbolIndex(string memory symbolName) public view returns(uint8){
       for (uint8 i = 0; i < SymbolNameIndex; i++){
            if (keccak256(abi.encodePacked(tokens[i].symbolName)) == keccak256(abi.encodePacked(symbolName))){
                return i;
            }
        }
        revert("This token does not exist");
    }
    
    // getBuyOrderBook / getSellOrderBook minimal traversals (as before)
    function getBuyOrderBook(string memory symbolName) public view returns (uint[] memory, uint[] memory) {
        require(hasToken(symbolName), "Token does not exist");
        uint8 index = getSymbolIndex(symbolName);

        Token storage t = tokens[index];
        uint len = t.amountBuyPrices;
        uint[] memory prices = new uint[](len);
        uint[] memory amounts = new uint[](len);

        uint curr = t.currBuyPrice;
        for (uint i = 0; i < len; i++) {
            if (curr == 0) break;
            prices[i] = curr;

            OrderBook storage ob = t.buyOrderBook[curr];
            uint total = 0;
            for (uint k = 0; k < ob.offers_key; k++) {
                total += ob.offers[k].amount;
            }
            amounts[i] = total;

            curr = ob.lowerPrice;
        }

        return (prices, amounts);
    }

    function getSellOrderBook(string memory symbolName) public view returns (uint[] memory, uint[] memory) {
        require(hasToken(symbolName), "Token does not exist");
        uint8 index = getSymbolIndex(symbolName);

        Token storage t = tokens[index];
        uint len = t.amountSellPrices;
        uint[] memory prices = new uint[](len);
        uint[] memory amounts = new uint[](len);

        uint curr = t.currSellPrice;
        for (uint i = 0; i < len; i++) {
            if (curr == 0) break;
            prices[i] = curr;

            OrderBook storage ob = t.sellOrderBook[curr];
            uint total = 0;
            for (uint k = 0; k < ob.offers_key; k++) {
                total += ob.offers[k].amount;
            }
            amounts[i] = total;

            curr = ob.higherPrice;
        }

        return (prices, amounts);
    }

    /* ===== Fixed semantics: buyToken & sellToken ===== */

    /// @notice Buy `amount` tokens at `price` (price is in wei per token unit).
    /// Buyer must have previously deposited ETH into `balanceETHForAddress`.
    /// Tokens are taken from the contract's token reserve (tokenBalanceForAddress[address(this)][index]).
    function buyToken(string memory symbolName, uint price, uint amount) public {
        require(hasToken(symbolName), "Token does not exist");
        require(price > 0 && amount > 0, "Price and amount > 0 required");

        uint8 index = getSymbolIndex(symbolName);
        address tokenAddress = tokens[index].erc20TokenAddress;
        require(tokenAddress != address(0), "Token address is zero");

        uint256 totalCost = price * amount;
        // ensure buyer has enough deposited ETH
        require(balanceETHForAddress[msg.sender] >= totalCost, "Insufficient ETH balance");

        // ensure contract has token reserve to sell
        require(tokenBalanceForAddress[address(this)][index] >= amount, "Contract has insufficient token reserve");

        // deduct ETH from buyer (ETH stays in contract as reserve)
        balanceETHForAddress[msg.sender] -= totalCost;

        // move tokens from contract reserve to buyer's internal token balance
        tokenBalanceForAddress[address(this)][index] -= amount;
        tokenBalanceForAddress[msg.sender][index] += amount;
    }

    /// @notice Sell `amount` tokens at `price` (price is in wei per token unit).
    /// Seller must have tokens deposited in internal balance (`tokenBalanceForAddress`).
    /// Tokens are moved from seller to contract reserve and seller's ETH internal balance is credited.
    function sellToken(string memory symbolName, uint price, uint amount) public {
        require(hasToken(symbolName), "Token does not exist");
        require(price > 0 && amount > 0, "Price and amount > 0 required");

        uint8 index = getSymbolIndex(symbolName);
        address tokenAddress = tokens[index].erc20TokenAddress;
        require(tokenAddress != address(0), "Token address is zero");

        // ensure seller has tokens in internal balance
        require(tokenBalanceForAddress[msg.sender][index] >= amount, "Insufficient token balance");

        // move tokens from seller to contract reserve
        tokenBalanceForAddress[msg.sender][index] -= amount;
        tokenBalanceForAddress[address(this)][index] += amount;

        // credit seller's internal ETH balance
        uint256 proceeds = price * amount;
        balanceETHForAddress[msg.sender] += proceeds;
    }

    /// @notice Cancelling buy orders / orderbook not implemented in this minimal fix.
    /// Keeping function but explicitly reverting so caller sees intended state.
    function cancelBuyOrder(string memory /*symbolName*/, bool /*isSell*/, uint /*price*/, uint /*offerValue*/) public pure {
        revert("Orderbook/cancel not implemented in minimal fix");
    }


}
