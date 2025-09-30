import { useState, useEffect } from "react";
import { useOrderBook, useHasToken } from "../hooks/useExchangeContract";
import { formatEther } from "viem";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * Displays buy and sell order books for a token
 * Shows price levels and total amounts available
 */
export default function OrderBook() {
  const [symbol, setSymbol] = useState("");
  const [searchSymbol, setSearchSymbol] = useState("");

  // Check if token exists before fetching order book
  const { hasToken } = useHasToken(searchSymbol);

  // Fetch buy and sell order books
  const buyBook = useOrderBook(searchSymbol, true);
  const sellBook = useOrderBook(searchSymbol, false);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchSymbol(symbol.toUpperCase());
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Order Book</h2>

      {/* Token Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter token symbol (e.g., USDC)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold"
          >
            Search
          </button>
        </div>
      </form>

      {/* Display message if no token searched yet */}
      {!searchSymbol && (
        <p className="text-gray-400 text-center py-8">
          Enter a token symbol to view order book
        </p>
      )}

      {/* Display message if token doesn't exist */}
      {searchSymbol && hasToken === false && (
        <p className="text-red-400 text-center py-8">
          Token "{searchSymbol}" not found on this exchange
        </p>
      )}

      {/* Display order books if token exists */}
      {searchSymbol && hasToken && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Buy Orders (Bids) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h3 className="font-semibold text-green-400">Buy Orders</h3>
            </div>

            {buyBook.isLoading ? (
              <p className="text-gray-400">Loading...</p>
            ) : buyBook.prices.length === 0 ? (
              <p className="text-gray-500">No buy orders</p>
            ) : (
              <div className="space-y-2">
                {/* Table Header */}
                <div className="flex justify-between text-xs text-gray-400 pb-2 border-b border-gray-700">
                  <span>Price (ETH)</span>
                  <span>Amount</span>
                </div>

                {/* Order Rows */}
                {buyBook.prices.map((price, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-green-400 font-mono">
                      {formatEther(price)}
                    </span>
                    <span className="font-mono">
                      {buyBook.amounts[index].toString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sell Orders (Asks) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-red-400">Sell Orders</h3>
            </div>

            {sellBook.isLoading ? (
              <p className="text-gray-400">Loading...</p>
            ) : sellBook.prices.length === 0 ? (
              <p className="text-gray-500">No sell orders</p>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 pb-2 border-b border-gray-700">
                  <span>Price (ETH)</span>
                  <span>Amount</span>
                </div>

                {sellBook.prices.map((price, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-red-400 font-mono">
                      {formatEther(price)}
                    </span>
                    <span className="font-mono">
                      {sellBook.amounts[index].toString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
