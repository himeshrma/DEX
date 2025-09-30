import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "./config/wagmi";
import App from "./App";
import "./index.css";

// QueryClient manages server state (blockchain data in our case)
// It caches data, handles refetching, and manages loading states
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* WagmiProvider gives all child components access to Wagmi hooks */}
    <WagmiProvider config={config}>
      {/* QueryClientProvider enables React Query throughout the app */}
      <QueryClientProvider client={queryClient}>
        {/* RainbowKitProvider provides the wallet connection UI */}
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
