// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract Exchange is Ownable {

    constructor() Ownable(msg.sender) {}

    /* =================== Events =================== */
    event DepositETH(address indexed user, uint amount);
    event WithdrawETH(address indexed user, uint amount);
    event DepositToken(address indexed user, string symbol, uint amount);
    event WithdrawToken(address indexed user, string symbol, uint amount);
    event PlaceOrder(address indexed user, string symbol, bool isBuy, uint price, uint amount);
    event TradeExecuted(address indexed buyer, address indexed seller, string symbol, uint price, uint amount);
    event CancelOrder(address indexed user, string symbol, bool isBuy, uint price, uint amount);

    /* =================== Data Structures =================== */

    struct Offer {
        uint amount;
        address who;
    }

    struct PriceNode {
        uint price;
        uint totalAmount;
        mapping(uint => Offer) offers;
        uint offersKey;
        uint offersLength;
        uint next; 
        uint prev; 
    }

    struct OrderBook {
        uint head; 
        uint tail; 
        mapping(uint => PriceNode) prices;
        uint pricesCount;
    }

    struct Token {
        string symbolName;
        address erc20TokenAddress;
        OrderBook buyBook;
        OrderBook sellBook;
    }

    mapping(uint8 => Token) private tokens;
    uint8 public SymbolNameIndex;

    mapping(address => mapping(uint8 => uint)) public tokenBalanceForAddress;
    mapping(address => uint) public balanceETHForAddress;

    /* =================== Token Management =================== */

    function addToken(string memory symbolName, address erc20TokenAddress) public onlyOwner {
        require(!hasToken(symbolName), "Token exists");
        tokens[SymbolNameIndex].symbolName = symbolName;
        tokens[SymbolNameIndex].erc20TokenAddress = erc20TokenAddress;
        SymbolNameIndex++;
    }

    function hasToken(string memory symbolName) public view returns(bool){
        bytes32 target = keccak256(abi.encodePacked(symbolName));
        for(uint8 i = 0; i < SymbolNameIndex; i++){
            if(keccak256(abi.encodePacked(tokens[i].symbolName)) == target){
                return true;
            }
        }
        return false;
    }

    function getSymbolIndex(string memory symbolName) public view returns(uint8){
       for(uint8 i=0;i<SymbolNameIndex;i++){
            if(keccak256(abi.encodePacked(tokens[i].symbolName)) == keccak256(abi.encodePacked(symbolName))){
                return i;
            }
        }
        revert("Token does not exist");
    }

    /* =================== ETH Deposit/Withdraw =================== */

    function depositEther() payable public {
        balanceETHForAddress[msg.sender] += msg.value;
        emit DepositETH(msg.sender, msg.value);
    }

    function withdrawEther(uint amount) public {
        require(balanceETHForAddress[msg.sender] >= amount, "Insufficient ETH");
        balanceETHForAddress[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit WithdrawETH(msg.sender, amount);
    }

    /* =================== ERC20 Deposit/Withdraw =================== */

    function depositToken(string memory symbolName, uint amount) public {
        uint8 idx = getSymbolIndex(symbolName);
        address tokenAddr = tokens[idx].erc20TokenAddress;
        IERC20 token = IERC20(tokenAddr);
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient allowance");
        tokenBalanceForAddress[msg.sender][idx] += amount;
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit DepositToken(msg.sender, symbolName, amount);
    }

    function withdrawToken(string memory symbolName, uint amount) public {
        uint8 idx = getSymbolIndex(symbolName);
        require(tokenBalanceForAddress[msg.sender][idx] >= amount, "Insufficient token balance");
        tokenBalanceForAddress[msg.sender][idx] -= amount;
        IERC20 token = IERC20(tokens[idx].erc20TokenAddress);
        require(token.transfer(msg.sender, amount), "Transfer failed");
        emit WithdrawToken(msg.sender, symbolName, amount);
    }

    /* =================== Linked-List Orderbook =================== */

    function _insertPriceNode(OrderBook storage ob, uint price, bool isBuy) internal {
        PriceNode storage node = ob.prices[price];
        if (node.price != 0) return; // already exists
        node.price = price;

        if (ob.head == 0) {
            ob.head = price;
            ob.tail = price;
        } else {
            uint curr = ob.head;
            while (curr != 0 && (isBuy ? curr > price : curr < price)) {
                curr = ob.prices[curr].next;
            }

            if (curr == ob.head) {
                node.next = ob.head;
                ob.prices[ob.head].prev = price;
                ob.head = price;
            } else if (curr == 0) {
                node.prev = ob.tail;
                ob.prices[ob.tail].next = price;
                ob.tail = price;
            } else {
                uint prev = ob.prices[curr].prev;
                node.prev = prev;
                node.next = curr;
                ob.prices[prev].next = price;
                ob.prices[curr].prev = price;
            }
        }
        ob.pricesCount++;
    }

    /* =================== Place Orders =================== */

    function placeBuyOrder(string memory symbolName, uint price, uint amount) public {
        uint8 idx = getSymbolIndex(symbolName);
        require(balanceETHForAddress[msg.sender] >= price * amount, "Insufficient ETH");

        OrderBook storage ob = tokens[idx].buyBook;
        _insertPriceNode(ob, price, true);

        PriceNode storage node = ob.prices[price];
        node.offers[node.offersKey++] = Offer(amount, msg.sender);
        node.offersLength++;
        node.totalAmount += amount;

        balanceETHForAddress[msg.sender] -= price * amount;
        emit PlaceOrder(msg.sender, symbolName, true, price, amount);

        _matchOrders(idx);
    }

    function placeSellOrder(string memory symbolName, uint price, uint amount) public {
        uint8 idx = getSymbolIndex(symbolName);
        require(tokenBalanceForAddress[msg.sender][idx] >= amount, "Insufficient tokens");

        OrderBook storage ob = tokens[idx].sellBook;
        _insertPriceNode(ob, price, false);

        PriceNode storage node = ob.prices[price];
        node.offers[node.offersKey++] = Offer(amount, msg.sender);
        node.offersLength++;
        node.totalAmount += amount;

        tokenBalanceForAddress[msg.sender][idx] -= amount;
        emit PlaceOrder(msg.sender, symbolName, false, price, amount);

        _matchOrders(idx);
    }

    /* =================== Matching Engine =================== */

    function _matchOrders(uint8 idx) internal {
        OrderBook storage buyBook = tokens[idx].buyBook;
        OrderBook storage sellBook = tokens[idx].sellBook;

        uint currBuy = buyBook.head;
        uint currSell = sellBook.head;

        while (currBuy != 0 && currSell != 0 && currBuy >= currSell) {
            PriceNode storage buyNode = buyBook.prices[currBuy];
            PriceNode storage sellNode = sellBook.prices[currSell];

            uint buyOfferKey = 0;
            uint sellOfferKey = 0;

            while (buyOfferKey < buyNode.offersKey && sellOfferKey < sellNode.offersKey) {
                Offer storage buyOffer = buyNode.offers[buyOfferKey];
                Offer storage sellOffer = sellNode.offers[sellOfferKey];

                uint tradeAmount = buyOffer.amount < sellOffer.amount ? buyOffer.amount : sellOffer.amount;
                uint tradePrice = sellNode.price;

                buyOffer.amount -= tradeAmount;
                sellOffer.amount -= tradeAmount;

                tokenBalanceForAddress[buyOffer.who][idx] += tradeAmount;
                balanceETHForAddress[sellOffer.who] += tradeAmount * tradePrice;

                buyNode.totalAmount -= tradeAmount;
                sellNode.totalAmount -= tradeAmount;

                emit TradeExecuted(buyOffer.who, sellOffer.who, tokens[idx].symbolName, tradePrice, tradeAmount);

                if (buyOffer.amount == 0) buyOfferKey++;
                if (sellOffer.amount == 0) sellOfferKey++;
            }

            if (buyNode.totalAmount == 0) {
                uint next = buyNode.next;
                _removeNode(buyBook, currBuy);
                currBuy = next;
            } else currBuy = buyNode.next;

            if (sellNode.totalAmount == 0) {
                uint next = sellNode.next;
                _removeNode(sellBook, currSell);
                currSell = next;
            } else currSell = sellNode.next;
        }
    }

    function _removeNode(OrderBook storage ob, uint price) internal {
        PriceNode storage node = ob.prices[price];
        if (node.prev != 0) ob.prices[node.prev].next = node.next;
        if (node.next != 0) ob.prices[node.next].prev = node.prev;
        if (ob.head == price) ob.head = node.next;
        if (ob.tail == price) ob.tail = node.prev;
        delete ob.prices[price];
        ob.pricesCount--;
    }

    /* =================== Cancel Order =================== */

    function cancelOrder(string memory symbolName, bool isBuy, uint price, uint offerIndex) public {
        uint8 idx = getSymbolIndex(symbolName);
        OrderBook storage ob = isBuy ? tokens[idx].buyBook : tokens[idx].sellBook;
        PriceNode storage node = ob.prices[price];
        require(offerIndex < node.offersKey, "Invalid offer index");

        Offer storage off = node.offers[offerIndex];
        require(off.who == msg.sender, "Not your order");
        uint amt = off.amount;
        require(amt > 0, "Already filled");

        off.amount = 0;
        node.totalAmount -= amt;

        if (isBuy) balanceETHForAddress[msg.sender] += amt * price;
        else tokenBalanceForAddress[msg.sender][idx] += amt;

        emit CancelOrder(msg.sender, symbolName, isBuy, price, amt);

        if (node.totalAmount == 0) _removeNode(ob, price);
    }

    /* =================== Orderbook View =================== */

    function getBuyOrderBook(string memory symbolName) public view returns(uint[] memory prices, uint[] memory amounts){
        uint8 idx = getSymbolIndex(symbolName);
        OrderBook storage ob = tokens[idx].buyBook;
        prices = new uint[](ob.pricesCount);
        amounts = new uint[](ob.pricesCount);

        uint curr = ob.head;
        uint i = 0;
        while (curr != 0) {
            prices[i] = curr;
            amounts[i] = ob.prices[curr].totalAmount;
            curr = ob.prices[curr].next;
            i++;
        }
    }

    function getSellOrderBook(string memory symbolName) public view returns(uint[] memory prices, uint[] memory amounts){
        uint8 idx = getSymbolIndex(symbolName);
        OrderBook storage ob = tokens[idx].sellBook;
        prices = new uint[](ob.pricesCount);
        amounts = new uint[](ob.pricesCount);

        uint curr = ob.head;
        uint i = 0;
        while (curr != 0) {
            prices[i] = curr;
            amounts[i] = ob.prices[curr].totalAmount;
            curr = ob.prices[curr].next;
            i++;
        }
    }
}
