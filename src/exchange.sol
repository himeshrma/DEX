// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.13;

import "./owned.sol";

contract Exchange is Owned {

    struct Token{}

    struct Offer{}

    struct OrderBook{}

    mapping(uint8 => Token) tokens;
    uint8 SymbolNameIndex;

    mapping(address=>mapping(uint=>uint)) public tokenBalanceForAddress;
    mapping(address=>uint)balanceETHForAddress;


    function depositEther()payable public{ }
    function withdrawEther(uint amount)public{
}
    function getEthBalance()public view returns(uint){
        return balanceETHForAddress[msg.sender];
    }
    function depositToken(string symbolName,uint amount)public onlyOwner{
    }
    function withdrawToken(string symbolName,uint amount)public onlyOwner{
    }
    function getTokenBalance(string symbolName)public view returns(uint){
        return tokenBalanceForAddress[msg.sender][SymbolNameIndex];
    }


    function addToken(string memory symbolName,address erc20TokenAddress)public onlyOwner{
        tokens[SymbolNameIndex]=Token();
        SymbolNameIndex++;
    }

    function hasToken(string memory symbolName)public view returns(bool){
      
    }

    function getSymbolIndex(string memory symbolName)public view returns(uint8){
       
    }

   function getBuyOrderBook(string memory symbolName)public view returns(uint[] memory,uint[] memory){
    }

   function getSellOrderBook(string memory symbolName)public view returns(uint[] memory,uint[] memory){
    }


    function buyToken(string memory symbolName,uint price,uint amount)public{
    }

    function sellToken(string memory symbolName,uint price,uint amount)public{
    }

    function cancelBuyOrder(string memory symbolName,bool isSell, uint price, uint offerValue)public{
    }

    // modifier onlyOwner(){
    //     require(msg.sender==owner);
    //     _;
    // }
}