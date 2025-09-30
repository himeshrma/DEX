import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, mainnet, hardhat } from "wagmi/chains";

// This creates the Wagmi configuration
// It handles wallet connections, chain configurations, and RPC providers
export const config = getDefaultConfig({
  appName: "DEX Exchange",
  projectId: "98ef8411da6a87960cfecc848a90d7c6", // Get free from https://cloud.walletconnect.com/
  chains: [
    hardhat, // For local development
    sepolia, // For testnet
    // mainnet // Uncomment for production
  ],
  ssr: false, // We're not using server-side rendering
});
