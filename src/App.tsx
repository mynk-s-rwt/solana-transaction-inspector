import React, { useMemo, useState, useCallback } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { 
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter
} from '@solana/wallet-adapter-wallets';
import {
    WalletModalProvider,
    WalletMultiButton,
    useWalletModal
} from '@solana/wallet-adapter-react-ui';
import CustomWalletModal from './components/CustomWalletModal';
import WalletOptionsModal from './components/WalletOptionsModal';
import solanaLogo from '/solana-logo.svg';

import '@solana/wallet-adapter-react-ui/styles.css';
import './App.css';
import './wallet-styles-backup.css';
import TransactionInspector from './components/TransactionInspector';
import RpcSettings from './components/RpcSettings';
import { getRpcEndpoint, getCurrentNetwork } from './config/rpc';

const CustomWalletButton: React.FC = () => {
    const { publicKey, wallet, disconnect, connected, select, connect, wallets } = useWallet();
    const { setVisible } = useWalletModal();
    const [showOptions, setShowOptions] = useState(false);
    const [showCustomModal, setShowCustomModal] = useState(false);

    // Debug wallet state changes
    React.useEffect(() => {
        console.log('Wallet state changed:', {
            connected,
            walletName: wallet?.adapter.name,
            publicKey: publicKey?.toString(),
            availableWallets: wallets.map(w => w.adapter.name)
        });
    }, [connected, wallet, publicKey, wallets]);

    // Close options modal when wallet disconnects or changes
    React.useEffect(() => {
        if (!connected || !publicKey) {
            setShowOptions(false);
        }
    }, [connected, publicKey]);

    const handleClick = () => {
        if (connected && publicKey) {
            // When connected, show wallet management options
            setShowOptions(true);
        } else {
            // When not connected, show custom wallet selection modal
            setShowCustomModal(true);
        }
    };

    const handleCopyAddress = () => {
        if (publicKey) {
            navigator.clipboard.writeText(publicKey.toString());
            setShowOptions(false);
        }
    };

    const handleChangeWallet = () => {
        setShowCustomModal(true);
        setShowOptions(false);
    };

    const handleDisconnect = () => {
        disconnect();
        setShowOptions(false);
    };

    return (
        <div className="custom-wallet-container">
            <button 
                key={`wallet-btn-${wallet?.adapter.name || 'none'}-${connected ? 'connected' : 'disconnected'}`}
                className="wallet-adapter-button wallet-adapter-button-trigger" 
                onClick={handleClick}
            >
                {connected && publicKey ? (
                    <>
                        {wallet?.adapter.icon && (
                            <img 
                                src={wallet.adapter.icon} 
                                alt={wallet.adapter.name || 'Wallet'} 
                                style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                            />
                        )}
                        <span style={{ marginLeft: '8px' }}>
                            {wallet?.adapter.name || 'Wallet'}
                        </span>
                    </>
                ) : (
                    'Select Wallet'
                )}
            </button>
            
            <CustomWalletModal 
                visible={showCustomModal} 
                onClose={() => setShowCustomModal(false)} 
            />
            
            <WalletOptionsModal
                visible={showOptions}
                onClose={() => setShowOptions(false)}
                onCopyAddress={handleCopyAddress}
                onChangeWallet={handleChangeWallet}
                onDisconnect={handleDisconnect}
            />
        </div>
    );
};

function App() {
    const [endpoint, setEndpoint] = useState(getRpcEndpoint());
    const [showRpcSettings, setShowRpcSettings] = useState(false);
    
    const network = getCurrentNetwork(endpoint) === 'devnet' 
        ? WalletAdapterNetwork.Devnet 
        : WalletAdapterNetwork.Mainnet;
    
    const wallets = useMemo(
        () => {
            const walletList = [
                new PhantomWalletAdapter(),
                new SolflareWalletAdapter({ network }),
                new TorusWalletAdapter(),
                new LedgerWalletAdapter()
            ];
            
            // Filter out any duplicate wallet names to prevent React key conflicts
            const uniqueWallets = walletList.filter((wallet, index, array) => 
                array.findIndex(w => w.name === wallet.name) === index
            );
            
            return uniqueWallets;
        },
        [network]
    );

    const handleEndpointChange = useCallback((newEndpoint: string) => {
        setEndpoint(newEndpoint);
        // Force a page reload to reinitialize the connection with the new endpoint
        window.location.reload();
    }, []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider 
                wallets={wallets} 
                autoConnect={false}
                onError={(error) => {
                    console.error('Wallet provider error:', error);
                }}
            >
                <WalletModalProvider>
                    <div className="App">
                        <header className="App-header">
                            <div className="header-left">
                                <img src={solanaLogo} alt="Solana" className="solana-logo" />
                                <div className="header-title">
                                    <h1>Transaction Inspector</h1>
                                    <span className="header-subtitle">Simulate, Sign & Send</span>
                                </div>
                            </div>
                            <div className="header-right">
                                <CustomWalletButton />
                                <button 
                                    className="rpc-settings-button"
                                    onClick={() => setShowRpcSettings(true)}
                                    title="RPC Settings"
                                >
                                    ⚙️
                                </button>
                            </div>
                        </header>
                        <main>
                            <TransactionInspector />
                        </main>
                        
                        <RpcSettings
                            isOpen={showRpcSettings}
                            onClose={() => setShowRpcSettings(false)}
                            onEndpointChange={handleEndpointChange}
                        />
                    </div>
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}

export default App;
