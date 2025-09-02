import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { logger } from '../utils/logger';
import LogsPanel from './LogsPanel';
import './TransactionInspector.css';

const TransactionInspector: React.FC = () => {
    const [transactionData, setTransactionData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [showLogs, setShowLogs] = useState(false);
    
    const { publicKey, signTransaction, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const handleTransactionSubmit = async () => {
        // Clear previous logs for fresh transaction session
        logger.clearLogs();
        
        logger.info('🚀 Starting new transaction processing session', {
            walletConnected: !!publicKey,
            walletAddress: publicKey?.toString(),
            transactionDataLength: transactionData.trim().length,
            rpcEndpoint: connection.rpcEndpoint
        });

        if (!publicKey) {
            const errorMsg = 'Please connect your wallet first';
            logger.error('❌ Wallet not connected', { error: errorMsg });
            setError(errorMsg);
            return;
        }

        if (!transactionData.trim()) {
            const errorMsg = 'Please enter transaction data';
            logger.error('❌ No transaction data provided', { error: errorMsg });
            setError(errorMsg);
            return;
        }

        setIsLoading(true);
        setError('');
        setResult('');

        try {
            logger.info('📝 Parsing transaction data...');
            let transaction: Transaction | VersionedTransaction;
            let transactionType = 'unknown';
            
            try {
                const buffer = Buffer.from(transactionData.trim(), 'base64');
                logger.debug('🔍 Attempting legacy transaction parsing', { bufferLength: buffer.length });
                transaction = Transaction.from(buffer);
                transactionType = 'legacy';
                logger.success('✅ Successfully parsed as legacy transaction');
            } catch (legacyError) {
                logger.warn('⚠️ Legacy transaction parsing failed, trying versioned', { error: legacyError });
                try {
                    const buffer = Buffer.from(transactionData.trim(), 'base64');
                    transaction = VersionedTransaction.deserialize(buffer);
                    transactionType = 'versioned';
                    logger.success('✅ Successfully parsed as versioned transaction');
                } catch (versionedError) {
                    logger.error('❌ Both transaction parsing methods failed', {
                        legacyError: legacyError,
                        versionedError: versionedError
                    });
                    throw new Error('Invalid transaction format. Please provide a valid base64 encoded transaction.');
                }
            }

            logger.info('🎯 Starting transaction simulation...', {
                transactionType,
                endpoint: connection.rpcEndpoint
            });

            const simulationResult = await connection.simulateTransaction(transaction as any);
            
            logger.info('📊 Simulation completed', {
                success: !simulationResult.value.err,
                logsCount: simulationResult.value.logs?.length || 0,
                unitsConsumed: simulationResult.value.unitsConsumed,
                error: simulationResult.value.err
            });

            if (simulationResult.value.err) {
                const errorMsg = `Simulation failed: ${JSON.stringify(simulationResult.value.err)}`;
                logger.error('❌ Transaction simulation failed', {
                    error: simulationResult.value.err,
                    logs: simulationResult.value.logs
                });
                setError(errorMsg);
                return;
            }

            const simulationLogs = simulationResult.value.logs?.join('\n') || 'No logs';
            const resultText = `Simulation successful!\nLogs: ${simulationLogs}\nUnits consumed: ${simulationResult.value.unitsConsumed}`;
            
            logger.success('✅ Simulation successful', {
                unitsConsumed: simulationResult.value.unitsConsumed,
                logsPreview: simulationResult.value.logs?.slice(0, 3)
            });
            
            setResult(resultText);

            if (transaction instanceof Transaction) {
                if (!signTransaction) {
                    const errorMsg = 'Wallet does not support transaction signing';
                    logger.error('❌ Wallet signing not supported', { walletType: 'unsupported' });
                    setError(errorMsg);
                    return;
                }

                logger.info('✍️ Requesting transaction signature...');
                const signedTransaction = await signTransaction(transaction);
                logger.success('✅ Transaction signed successfully');

                logger.info('📤 Sending transaction to network...');
                const signature = await sendTransaction(signedTransaction, connection);
                
                logger.success('🎉 Transaction sent!', {
                    signature,
                    explorer: `https://solscan.io/tx/${signature}`
                });
                
                setResult(prev => prev + `\n\nTransaction sent! Signature: ${signature}`);
                
                logger.info('⏳ Waiting for transaction confirmation...');
                await connection.confirmTransaction(signature, 'processed');
                
                logger.success('🎊 Transaction confirmed!', { signature });
                setResult(prev => prev + `\nTransaction confirmed!`);
            } else {
                const errorMsg = 'Versioned transactions not fully supported in this demo';
                logger.warn('⚠️ Versioned transaction limitation', { transactionType });
                setError(errorMsg);
            }

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
            logger.error('💥 Transaction processing failed', {
                error: err,
                errorMessage: errorMsg,
                stack: err instanceof Error ? err.stack : undefined
            });
            setError(`Error: ${errorMsg}`);
        } finally {
            setIsLoading(false);
            logger.info('🏁 Transaction processing completed');
        }
    };

    return (
        <div className="transaction-inspector">
            <div className="inspector-card">
                <div className="card-header">
                    <div className="input-section">
                        <label htmlFor="transaction-input">Transaction Data (Base64):</label>
                        <textarea
                            id="transaction-input"
                            value={transactionData}
                            onChange={(e) => setTransactionData(e.target.value)}
                            placeholder="Paste your base64 encoded transaction data here..."
                            rows={8}
                            className="transaction-input"
                        />
                        
                        <div className="action-buttons">
                            <button 
                                onClick={handleTransactionSubmit}
                                disabled={isLoading || !publicKey}
                                className="send-button"
                            >
                                {isLoading ? 'Processing...' : 'Simulate, Sign & Send Transaction'}
                            </button>
                            
                            <button 
                                onClick={() => setShowLogs(!showLogs)}
                                className="logs-button"
                                title="Toggle logs panel"
                            >
                                📋 Logs
                            </button>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="error-section">
                        <h3>Error:</h3>
                        <pre>{error}</pre>
                    </div>
                )}

                {result && (
                    <div className="result-section">
                        <h3>Result:</h3>
                        <pre>{result}</pre>
                    </div>
                )}

                {!publicKey && (
                    <div className="warning">
                        Please connect your wallet to use the transaction inspector.
                    </div>
                )}

                {showLogs && <LogsPanel onClose={() => setShowLogs(false)} />}
            </div>
        </div>
    );
};

export default TransactionInspector;