import React from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import './CustomWalletModal.css';

interface CustomWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

const CustomWalletModal: React.FC<CustomWalletModalProps> = ({ visible, onClose }) => {
  const { wallets, select, wallet, connect } = useWallet();

  if (!visible) return null;

  const handleWalletSelect = async (walletName: string) => {
    try {
      console.log('Attempting to select wallet:', walletName);
      select(walletName as any);
      onClose();
      
      // Give the wallet time to be selected, then attempt connection
      setTimeout(async () => {
        try {
          console.log('Attempting to connect to selected wallet...');
          await connect();
          console.log('Wallet connected successfully');
        } catch (connectError) {
          console.error('Error connecting wallet:', connectError);
          // Reopen modal if connection fails
          // onClose(); // Keep modal closed for now
        }
      }, 200);
    } catch (error) {
      console.error('Error selecting wallet:', error);
    }
  };

  // Filter out duplicate wallets based on name
  const uniqueWallets = wallets.filter((w, index, array) => 
    array.findIndex(wallet => wallet.adapter.name === w.adapter.name) === index
  );

  const modalContent = (
    <>
      <div className="wallet-modal-overlay" onClick={onClose} />
      <div className="wallet-modal">
        <div className="wallet-modal-header">
          <h3>Connect Wallet</h3>
          <button className="wallet-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="wallet-modal-content">
          
          <div className="wallet-list">
            {uniqueWallets.map((walletAdapter) => {
              const isDetected = walletAdapter.adapter.readyState === 'Installed';
              
              return (
                <button
                  key={`wallet-${walletAdapter.adapter.name}`}
                  className="wallet-option"
                  onClick={() => handleWalletSelect(walletAdapter.adapter.name)}
                  disabled={!isDetected}
                >
                  <div className="wallet-info">
                    {walletAdapter.adapter.icon && (
                      <img 
                        src={walletAdapter.adapter.icon} 
                        alt={walletAdapter.adapter.name} 
                        className="wallet-icon"
                      />
                    )}
                    <span className="wallet-name">{walletAdapter.adapter.name}</span>
                  </div>
                  <span className="wallet-status">
                    {isDetected ? 'Detected' : 'Not Detected'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="wallet-modal-footer">
          <button className="more-options-btn">More options ▼</button>
        </div>
      </div>
    </>
  );

  // Use portal to render outside the main app tree to avoid z-index issues
  return createPortal(modalContent, document.body);
};

export default CustomWalletModal;