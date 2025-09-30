// Store your deployed contract addresses here
export const EXCHANGE_ADDRESS = "0xYourExchangeContractAddress";

// You'll add token addresses as you list them on the exchange
export const TOKEN_ADDRESSES = {
  // Example: 'USDC': '0x...',
};

// Network configurations
export const NETWORKS = {
  hardhat: {
    id: 31337,
    name: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545",
  },
  sepolia: {
    id: 11155111,
    name: "Sepolia",
  },
};
