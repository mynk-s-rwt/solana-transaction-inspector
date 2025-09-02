import React, { useState, useEffect } from 'react';
import { DEFAULT_RPC_ENDPOINTS, getRpcEndpoint, setRpcEndpoint, type RpcConfig } from '../config/rpc';
import './RpcSettings.css';

interface RpcSettingsProps {
  onEndpointChange: (endpoint: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const RpcSettings: React.FC<RpcSettingsProps> = ({ onEndpointChange, isOpen, onClose }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState(getRpcEndpoint());
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const currentEndpoint = getRpcEndpoint();
    setSelectedEndpoint(currentEndpoint);
    
    // Check if current endpoint is custom
    const isCustom = !DEFAULT_RPC_ENDPOINTS.some(rpc => rpc.endpoint === currentEndpoint);
    if (isCustom) {
      setCustomEndpoint(currentEndpoint);
      setShowCustomInput(true);
    }
  }, []);

  const handleEndpointSelect = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    setRpcEndpoint(endpoint);
    onEndpointChange(endpoint);
    setShowCustomInput(false);
    setCustomEndpoint('');
  };

  const handleCustomEndpointSave = () => {
    if (customEndpoint.trim() && customEndpoint.startsWith('https://')) {
      setSelectedEndpoint(customEndpoint);
      setRpcEndpoint(customEndpoint);
      onEndpointChange(customEndpoint);
      setShowCustomInput(false);
    }
  };

  const handleCustomEndpointCancel = () => {
    setShowCustomInput(false);
    setCustomEndpoint('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="rpc-settings-overlay" onClick={onClose} />
      <div className="rpc-settings-modal">
        <div className="rpc-settings-header">
          <h3>RPC Settings</h3>
          <button className="rpc-settings-close" onClick={onClose}>×</button>
        </div>
        
        <div className="rpc-settings-content">
          <p className="rpc-settings-description">
            Choose an RPC endpoint to connect to the Solana network
          </p>
          
          <div className="rpc-endpoints-list">
            {DEFAULT_RPC_ENDPOINTS.map((rpc) => (
              <div
                key={rpc.endpoint}
                className={`rpc-endpoint-item ${selectedEndpoint === rpc.endpoint ? 'selected' : ''}`}
                onClick={() => handleEndpointSelect(rpc.endpoint)}
              >
                <div className="rpc-endpoint-info">
                  <div className="rpc-endpoint-name">{rpc.name}</div>
                  <div className="rpc-endpoint-url">{rpc.endpoint}</div>
                </div>
                <div className={`rpc-network-badge ${rpc.network}`}>
                  {rpc.network}
                </div>
              </div>
            ))}
            
            {/* Custom endpoint option */}
            <div
              className={`rpc-endpoint-item custom ${showCustomInput ? 'selected' : ''}`}
              onClick={() => setShowCustomInput(true)}
            >
              <div className="rpc-endpoint-info">
                <div className="rpc-endpoint-name">Custom RPC</div>
                <div className="rpc-endpoint-url">
                  {customEndpoint || 'Enter your own RPC endpoint'}
                </div>
              </div>
              <div className="rpc-network-badge custom">custom</div>
            </div>
            
            {showCustomInput && (
              <div className="custom-rpc-input">
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="https://your-custom-rpc-endpoint.com"
                  className="custom-rpc-field"
                  autoFocus
                />
                <div className="custom-rpc-actions">
                  <button
                    onClick={handleCustomEndpointSave}
                    disabled={!customEndpoint.trim() || !customEndpoint.startsWith('https://')}
                    className="custom-rpc-save"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCustomEndpointCancel}
                    className="custom-rpc-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="rpc-settings-footer">
            <div className="current-endpoint">
              <strong>Current:</strong> {selectedEndpoint}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RpcSettings;