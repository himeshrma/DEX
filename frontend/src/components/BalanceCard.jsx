import { useAccount, useBalance } from "wagmi";
import { useExchangeETHBalance } from "../hooks/useExchangeContract";
import { formatEther } from "viem";
import { Wallet } from "lucide-react";

/**
 * Displays user's wallet balance and exchange balance
 * Shows both ETH in wallet and ETH deposited in exchange
 */
export default function BalanceCard() {
  // Get connected wallet address
  const { address, isConnected } = useAccount();

  // Get wallet ETH balance using Wagmi's built-in hook
  const { data: walletBalance } = useBalance({
    address: address,
  });

  // Get exchange ETH balance using our custom hook
  const { balance: exchangeBalance } = useExchangeETHBalance(address);

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect wallet to view balances</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold">Your Balances</h2>
      </div>

      <div className="space-y-3">
        {/* Wallet Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Wallet ETH:</span>
          <span className="font-mono text-lg">
            {walletBalance
              ? parseFloat(formatEther(walletBalance.value)).toFixed(4)
              : "0.0000"}{" "}
            ETH
          </span>
        </div>

        {/* Exchange Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Exchange ETH:</span>
          <span className="font-mono text-lg text-green-400">
            {exchangeBalance
              ? parseFloat(formatEther(exchangeBalance)).toFixed(4)
              : "0.0000"}{" "}
            ETH
          </span>
        </div>
      </div>
    </div>
  );
}
