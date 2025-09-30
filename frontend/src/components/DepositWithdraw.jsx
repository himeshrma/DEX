import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useExchangeContract } from "../hooks/useExchangeContract";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

/**
 * Component for depositing and withdrawing ETH from the exchange
 * Demonstrates form handling and contract interaction
 */
export default function DepositWithdraw() {
  const { address, isConnected } = useAccount();
  const { depositEther, withdrawEther, isPending, isConfirming, isSuccess } =
    useExchangeContract();

  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState("deposit"); // 'deposit' or 'withdraw'
  const [error, setError] = useState("");

  // Handle deposit transaction
  const handleDeposit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Convert ETH amount to wei (smallest unit)
      const amountInWei = parseEther(amount);
      await depositEther(amountInWei);
      setAmount(""); // Clear input on success
    } catch (err) {
      setError(err.message);
      console.error("Deposit error:", err);
    }
  };

  // Handle withdraw transaction
  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const amountInWei = parseEther(amount);
      await withdrawEther(amountInWei);
      setAmount("");
    } catch (err) {
      setError(err.message);
      console.error("Withdraw error:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect wallet to deposit or withdraw</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Deposit / Withdraw ETH</h2>

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
          <ArrowDownToLine className="w-4 h-4 inline mr-2" />
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
          <ArrowUpFromLine className="w-4 h-4 inline mr-2" />
          Withdraw
        </button>
      </div>

      {/* Form */}
      <form onSubmit={activeTab === "deposit" ? handleDeposit : handleWithdraw}>
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            required
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded text-green-200 text-sm">
            Transaction successful!
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded font-semibold"
        >
          {isPending
            ? "Waiting for approval..."
            : isConfirming
            ? "Confirming..."
            : activeTab === "deposit"
            ? "Deposit ETH"
            : "Withdraw ETH"}
        </button>
      </form>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 mt-4">
        {activeTab === "deposit"
          ? "Deposit ETH to your exchange balance to place buy orders"
          : "Withdraw ETH from your exchange balance back to your wallet"}
      </p>
    </div>
  );
}
