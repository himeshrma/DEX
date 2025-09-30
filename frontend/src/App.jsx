import { useAccount } from "wagmi";
import WalletButton from "./components/WalletButton";
import BalanceCard from "./components/BalanceCard";
import DepositWithdraw from "./components/DepositWithdraw";
import TokenDepositWithdraw from "./components/TokenDepositWithdraw";
import OrderBook from "./components/OrderBook";
import PlaceOrder from "./components/PlaceOrder";
import AddToken from "./components/AddToken";

/**
 * Main application component
 * Organizes all components into a cohesive interface
 */
function App() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            DEX Exchange
          </h1>
          <WalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!isConnected ? (
          // Welcome screen when wallet not connected
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold mb-4">Welcome to DEX Exchange</h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet to start trading
            </p>
            <div className="max-w-md mx-auto">
              <WalletButton />
            </div>
          </div>
        ) : (
          // Main trading interface
          <div className="space-y-6">
            {/* Balance Overview */}
            <BalanceCard />

            {/* Two-column layout for deposits and trading */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left Column: Deposits/Withdrawals */}
              <div className="space-y-6">
                <DepositWithdraw />
                <TokenDepositWithdraw />
              </div>

              {/* Right Column: Trading */}
              <div className="space-y-6">
                <PlaceOrder />
                <OrderBook />
              </div>
            </div>

            {/* Admin Section */}
            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-2xl font-bold mb-4">Admin Functions</h2>
              <AddToken />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400">
          <p>DEX Exchange - Decentralized Trading Platform</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
