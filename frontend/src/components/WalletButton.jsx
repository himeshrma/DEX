import { ConnectButton } from "@rainbow-me/rainbowkit";

/**
 * Wallet connection button using RainbowKit
 * RainbowKit handles:
 * - Wallet selection modal
 * - Connection state
 * - Network switching
 * - Disconnect functionality
 * - Account display
 */
export default function WalletButton() {
  return (
    <div className="flex justify-end p-4">
      <ConnectButton
        showBalance={true} // Show ETH balance in wallet
        accountStatus="address" // Show full address or 'avatar'
        chainStatus="icon" // Show network icon or 'name'
      />
    </div>
  );
}
