import { useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useExchangeContract } from "../hooks/useExchangeContract";
import erc20ABI from "../contracts/erc20ABI.json";
import { EXCHANGE_ADDRESS } from "../utils/constants";

/**
 * Component for depositing and withdrawing ERC20 tokens
 * Handles token approval flow before deposit
 */
export default function TokenDepositWithdraw() {
  const { address, isConnected } = useAccount();
  const {
    depositToken,
    withdrawToken,
    isPending: exchangePending,
  } = useExchangeContract();
  const { writeContract, isPending: approvePending } = useWriteContract();

  const [activeTab, setActiveTab] = useState("deposit");
  const [symbol, setSymbol] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("input"); // 'input', 'approving', 'depositing'

  // Read user's token balance in their wallet
  const { data: walletBalance } = useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  // Read token decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "decimals",
    args: [],
    query: {
      enabled: !!tokenAddress,
    },
  });

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20ABI,
    functionName: "allowance",
    args: [address, EXCHANGE_ADDRESS],
    query: {
      enabled: !!tokenAddress && !!address,
    },
  });

  const handleApprove = async () => {
    setError("");
    setStep("approving");

    try {
      const amountInUnits = parseUnits(amount, decimals || 18);

      await writeContract({
        address: tokenAddress,
        abi: erc20ABI,
        functionName: "approve",
        args: [EXCHANGE_ADDRESS, amountInUnits],
      });

      // Wait a bit and refetch allowance
      setTimeout(() => {
        refetchAllowance();
        setStep("input");
      }, 2000);
    } catch (err) {
      setError(err.message);
      setStep("input");
      console.error("Approve error:", err);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const amountInUnits = parseUnits(amount, decimals || 18);

      // Check if approval is needed
      if (!allowance || allowance < amountInUnits) {
        setError("Please approve token spending first");
        return;
      }

      setStep("depositing");
      await depositToken(symbol.toUpperCase(), amountInUnits);
      setAmount("");
      setStep("input");
    } catch (err) {
      setError(err.message);
      setStep("input");
      console.error("Deposit error:", err);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const amountInUnits = parseUnits(amount, decimals || 18);
      await withdrawToken(symbol.toUpperCase(), amountInUnits);
      setAmount("");
    } catch (err) {
      setError(err.message);
      console.error("Withdraw error:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect wallet to manage tokens</p>
      </div>
    );
  }

  const needsApproval =
    activeTab === "deposit" &&
    tokenAddress &&
    amount &&
    (!allowance || allowance < parseUnits(amount, decimals || 18));

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Token Deposit / Withdraw</h2>

      {/* Tab Selection */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex-1 py-2 px-4 rounded ${
            activeTab === "deposit"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setActiveTab("withdraw")}
          className={`flex-1 py-2 px-4 rounded ${
            activeTab === "withdraw"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          Withdraw
        </button>
      </div>

      <form
        onSubmit={activeTab === "deposit" ? handleDeposit : handleWithdraw}
        className="space-y-4"
      >
        {/* Token Symbol */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Token Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g., USDC"
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            required
          />
        </div>

        {/* Token Address (for deposit) */}
        {activeTab === "deposit" && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Token Contract Address
            </label>
            <input
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white font-mono text-sm"
              required
            />
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount</label>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            required
          />
          {walletBalance && decimals && (
            <p className="text-xs text-gray-500 mt-1">
              Wallet Balance: {formatUnits(walletBalance, decimals)} {symbol}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Approval Button (shown when deposit needs approval) */}
        {needsApproval && (
          <button
            type="button"
            onClick={handleApprove}
            disabled={approvePending}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-semibold"
          >
            {approvePending ? "Approving..." : "Approve Token Spending"}
          </button>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={
            exchangePending || (activeTab === "deposit" && needsApproval)
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-semibold"
        >
          {exchangePending
            ? "Processing..."
            : activeTab === "deposit"
            ? "Deposit Tokens"
            : "Withdraw Tokens"}
        </button>
      </form>

      {/* Info about approval */}
      {activeTab === "deposit" && (
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded text-sm text-blue-200">
          <p className="font-semibold mb-1">Two-Step Process:</p>
          <p>1. Approve the exchange to spend your tokens</p>
          <p>2. Deposit tokens into the exchange</p>
        </div>
      )}
    </div>
  );
}
