import React, { useState, useEffect, useRef } from 'react';
import { logger, type LogEntry, type LogLevel } from '../utils/logger';
import './LogsPanel.css';

interface LogsPanelProps {
  onClose: () => void;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'all'>('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial load
    setLogs(logger.getLogs());

    // Set up polling for new logs
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAutoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const exportLogs = () => {
    const dataStr = logger.exportLogs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solana-transaction-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (level: LogLevel): string => {
    const icons = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅',
      debug: '🔍'
    };
    return icons[level];
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const copyLogToClipboard = (log: LogEntry) => {
    const logText = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(logText);
  };

  // Generate a more stable unique key for each log entry
  const generateLogKey = (log: LogEntry, originalIndex: number): string => {
    // Use timestamp + level + message hash + original index for uniqueness
    const messageHash = log.message.split('').reduce((hash, char) => {
      return ((hash << 5) - hash) + char.charCodeAt(0);
    }, 0);
    return `${log.timestamp}-${log.level}-${messageHash}-${originalIndex}`;
  };

  return (
    <div className="logs-panel">
      <div className="logs-header">
        <h3>Transaction Logs</h3>
        <div className="logs-controls">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as LogLevel | 'all')}
            className="filter-select"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warnings</option>
            <option value="error">Errors</option>
            <option value="success">Success</option>
            <option value="debug">Debug</option>
          </select>
          
          <label className="auto-scroll-toggle">
            <input
              type="checkbox"
              checked={isAutoScroll}
              onChange={(e) => setIsAutoScroll(e.target.checked)}
            />
            Auto-scroll
          </label>
          
          <button onClick={clearLogs} className="clear-button" title="Clear logs">
            🗑️
          </button>
          
          <button onClick={exportLogs} className="export-button" title="Export logs">
            💾
          </button>
          
          <button onClick={onClose} className="close-button" title="Close logs">
            ✕
          </button>
        </div>
      </div>
      
      <div className="logs-stats">
        <span className="log-count">
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
      </div>
      
      <div className="logs-container" ref={logsContainerRef}>
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            {logs.length === 0 ? 'No logs yet. Start a transaction to see logs.' : 'No logs match the current filter.'}
          </div>
        ) : (
          filteredLogs.map((log, filteredIndex) => {
            // Find the original index in the full logs array for stable keying
            const originalIndex = logs.findIndex(originalLog => 
              originalLog.timestamp === log.timestamp && 
              originalLog.level === log.level && 
              originalLog.message === log.message
            );
            
            return (
              <div 
                key={generateLogKey(log, originalIndex)} 
                className={`log-entry ${log.level}`}
                onClick={() => copyLogToClipboard(log)}
                title="Click to copy log to clipboard"
              >
                <div className="log-header">
                  <span className="log-icon">{getLogIcon(log.level)}</span>
                  <span className="log-level">{log.level.toUpperCase()}</span>
                  <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                </div>
                
                <div className="log-message">{log.message}</div>
                
                {log.data && (
                  <div className="log-data">
                    <details>
                      <summary>Data ({typeof log.data === 'object' ? Object.keys(log.data).length + ' properties' : 'value'})</summary>
                      <pre className="log-data-content">
                        {typeof log.data === 'object' 
                          ? JSON.stringify(log.data, null, 2)
                          : String(log.data)
                        }
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LogsPanel;