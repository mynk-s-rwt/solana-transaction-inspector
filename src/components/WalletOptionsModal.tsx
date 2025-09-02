import React from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import './WalletOptionsModal.css';

interface WalletOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onCopyAddress: () => void;
  onChangeWallet: () => void;
  onDisconnect: () => void;
}

const WalletOptionsModal: React.FC<WalletOptionsModalProps> = ({ 
  visible, 
  onClose, 
  onCopyAddress, 
  onChangeWallet, 
  onDisconnect 
}) => {
  const { wallet, publicKey } = useWallet();

  if (!visible || !wallet || !publicKey) return null;

  const modalContent = (
    <>
      <div className="wallet-options-overlay" onClick={onClose} />
      <div className="wallet-options-modal">
        <div className="wallet-options-header">
          <h3>Wallet Options</h3>
          <button className="wallet-options-close" onClick={onClose}>×</button>
        </div>
        
        <div className="wallet-options-content">
          <div className="wallet-info">
            {wallet.adapter.icon && (
              <img 
                src={wallet.adapter.icon} 
                alt={wallet.adapter.name} 
                className="wallet-info-icon"
              />
            )}
            <div className="wallet-info-details">
              <div className="wallet-info-name">{wallet.adapter.name}</div>
              <div className="wallet-info-address">
                {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
              </div>
            </div>
          </div>
          
          <div className="wallet-options-actions">
            <button onClick={onCopyAddress} className="wallet-option-button">
              <span className="wallet-option-icon">📋</span>
              <span className="wallet-option-text">Copy address</span>
            </button>
            
            <button onClick={onChangeWallet} className="wallet-option-button">
              <span className="wallet-option-icon">🔄</span>
              <span className="wallet-option-text">Change wallet</span>
            </button>
            
            <button onClick={onDisconnect} className="wallet-option-button disconnect">
              <span className="wallet-option-icon">🔌</span>
              <span className="wallet-option-text">Disconnect</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default WalletOptionsModal;