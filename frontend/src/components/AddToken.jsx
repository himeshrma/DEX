import { useState } from "react";
import { useAccount } from "wagmi";
import { isAddress } from "viem";
import { useExchangeContract } from "../hooks/useExchangeContract";
import { Plus } from "lucide-react";

/**
 * Component for adding new tokens to the exchange
 * Only accessible by contract owner
 */
export default function AddToken() {
  const { isConnected } = useAccount();
  const { addToken, isPending, isConfirming, isSuccess } =
    useExchangeContract();

  const [symbol, setSymbol] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate Ethereum address
    if (!isAddress(tokenAddress)) {
      setError("Invalid Ethereum address");
      return;
    }

    try {
      await addToken(symbol.toUpperCase(), tokenAddress);
      // Clear form on success
      setSymbol("");
      setTokenAddress("");
    } catch (err) {
      // Check if error is due to not being owner
      if (err.message.includes("Ownable")) {
        setError("Only the exchange owner can add tokens");
      } else if (err.message.includes("exists")) {
        setError("Token already exists on the exchange");
      } else {
        setError(err.message);
      }
      console.error("Add token error:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect wallet to add tokens</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-bold">Add New Token</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Token Address */}
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

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-3 bg-green-900/50 border border-green-600 rounded text-green-200 text-sm">
            Token added successfully!
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
            : "Add Token"}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600 rounded text-sm text-yellow-200">
        <p className="font-semibold mb-1">Owner Only:</p>
        <p>
          Only the exchange contract owner can add new tokens. Make sure you're
          connected with the owner wallet.
        </p>
      </div>
    </div>
  );
}
