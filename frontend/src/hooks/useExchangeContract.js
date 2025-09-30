import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { EXCHANGE_ADDRESS } from "../utils/constants";
import exchangeABI from "../contracts/exchangeABI.json";

/**
 * Custom hook for interacting with the Exchange contract
 * This centralizes all contract interactions in one place
 */
export function useExchangeContract() {
  // useWriteContract hook handles sending transactions
  const { writeContract, data: hash, isPending } = useWriteContract();

  // useWaitForTransactionReceipt waits for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Wrapper function for depositing ETH
  const depositEther = async (amount) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "depositEther",
      value: amount, // Send ETH with the transaction
    });
  };

  // Wrapper function for withdrawing ETH
  const withdrawEther = async (amount) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "withdrawEther",
      args: [amount],
    });
  };

  // Wrapper for token deposit
  const depositToken = async (symbol, amount) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "depositToken",
      args: [symbol, amount],
    });
  };

  // Wrapper for token withdrawal
  const withdrawToken = async (symbol, amount) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "withdrawToken",
      args: [symbol, amount],
    });
  };

  // Place buy order
  const placeBuyOrder = async (symbol, price, amount) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "placeBuyOrder",
      args: [symbol, price, amount],
    });
  };

  // Place sell order
  const placeSellOrder = async (symbol, price, amount) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "placeSellOrder",
      args: [symbol, price, amount],
    });
  };

  // Cancel order
  const cancelOrder = async (symbol, isBuy, price, offerIndex) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "cancelOrder",
      args: [symbol, isBuy, price, offerIndex],
    });
  };

  // Add token (owner only)
  const addToken = async (symbol, tokenAddress) => {
    return writeContract({
      address: EXCHANGE_ADDRESS,
      abi: exchangeABI,
      functionName: "addToken",
      args: [symbol, tokenAddress],
    });
  };

  return {
    depositEther,
    withdrawEther,
    depositToken,
    withdrawToken,
    placeBuyOrder,
    placeSellOrder,
    cancelOrder,
    addToken,
    isPending,
    isConfirming,
    isSuccess,
    hash,
  };
}

/**
 * Hook to read user's ETH balance in the exchange
 */
export function useExchangeETHBalance(address) {
  const { data, isLoading, refetch } = useReadContract({
    address: EXCHANGE_ADDRESS,
    abi: exchangeABI,
    functionName: "balanceETHForAddress",
    args: [address],
    // Watch for changes on every block
    watch: true,
  });

  return { balance: data, isLoading, refetch };
}

/**
 * Hook to read user's token balance in the exchange
 */
export function useExchangeTokenBalance(userAddress, tokenIndex) {
  const { data, isLoading, refetch } = useReadContract({
    address: EXCHANGE_ADDRESS,
    abi: exchangeABI,
    functionName: "tokenBalanceForAddress",
    args: [userAddress, tokenIndex],
    watch: true,
  });

  return { balance: data, isLoading, refetch };
}

/**
 * Hook to check if a token exists
 */
export function useHasToken(symbol) {
  const { data, isLoading } = useReadContract({
    address: EXCHANGE_ADDRESS,
    abi: exchangeABI,
    functionName: "hasToken",
    args: [symbol],
  });

  return { hasToken: data, isLoading };
}

/**
 * Hook to get order books
 */
export function useOrderBook(symbol, isBuy) {
  const functionName = isBuy ? "getBuyOrderBook" : "getSellOrderBook";

  const { data, isLoading, refetch } = useReadContract({
    address: EXCHANGE_ADDRESS,
    abi: exchangeABI,
    functionName,
    args: [symbol],
    watch: true, // Update when new blocks arrive
  });

  // data returns [prices[], amounts[]]
  return {
    prices: data?.[0] || [],
    amounts: data?.[1] || [],
    isLoading,
    refetch,
  };
}
