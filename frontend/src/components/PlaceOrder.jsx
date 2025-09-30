import { useState } from "react";
import { useAccount } from "wagmi";
import { parseEther } from "viem";
import { useExchangeContract, useHasToken } from "../hooks/useExchangeContract";
import { ShoppingCart, DollarSign } from "lucide-react";

/**
 * Component for placing buy and sell orders
 * Handles order validation and submission
 */
export default function PlaceOrder() {
  const { isConnected } = useAccount();
  const { placeBuyOrder, placeSellOrder, isPending, isConfirming, isSuccess } =
    useExchangeContract();

  const [orderType, setOrderType] = useState("buy"); // 'buy' or 'sell'
  const [symbol, setSymbol] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const { hasToken } = useHasToken(symbol);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!symbol) {
      setError("Please enter a token symbol");
      return;
    }

    if (hasToken === false) {
      setError(`Token "${symbol}" not found on exchange`);
      return;
    }

    try {
      // Convert ETH values to wei
      const priceInWei = parseEther(price);
      const amountValue = BigInt(amount); // Token amount as whole number

      if (orderType === "buy") {
        await placeBuyOrder(symbol, priceInWei, amountValue);
      } else {
        await placeSellOrder(symbol, priceInWei, amountValue);
      }

      // Clear form on success
      setPrice("");
      setAmount("");
    } catch (err) {
      setError(err.message);
      console.error("Order placement error:", err);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400">Connect wallet to place orders</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Place Order</h2>

      {/* Order Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setOrderType("buy")}
          className={`flex-1 py-2 px-4 rounded ${
            orderType === "buy"
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          <ShoppingCart className="w-4 h-4 inline mr-2" />
          Buy
        </button>
        <button
          onClick={() => setOrderType("sell")}
          className={`flex-1 py-2 px-4 rounded ${
            orderType === "sell"
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Sell
        </button>
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

        {/* Price */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Price per Token (ETH)
          </label>
          <input
            type="number"
            step="0.000001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Amount (Tokens)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
            required
          />
        </div>

        {/* Total Cost Display */}
        {price && amount && (
          <div className="bg-gray-700 rounded p-3">
            <p className="text-sm text-gray-400">Total Cost</p>
            <p className="text-lg font-bold">
              {(parseFloat(price) * parseFloat(amount)).toFixed(6)} ETH
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900/50 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {isSuccess && (
          <div className="p-3 bg-green-900/50 border border-green-600 rounded text-green-200 text-sm">
            Order placed successfully!
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isConfirming}
          className={`w-full ${
            orderType === "buy"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:bg-gray-600 text-white py-2 px-4 rounded font-semibold`}
        >
          {isPending
            ? "Waiting for approval..."
            : isConfirming
            ? "Confirming..."
            : `Place ${orderType === "buy" ? "Buy" : "Sell"} Order`}
        </button>
      </form>

      {/* Helper Text */}
      <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600 rounded text-sm text-blue-200">
        <p className="font-semibold mb-1">Note:</p>
        <p>
          {orderType === "buy"
            ? "Make sure you have enough ETH deposited in the exchange to place buy orders."
            : "Make sure you have enough tokens deposited in the exchange to place sell orders."}
        </p>
      </div>
    </div>
  );
}
