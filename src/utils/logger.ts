// Enhanced logging utility for Solana transaction operations
export class TransactionLogger {
  private static instance: TransactionLogger;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): TransactionLogger {
    if (!TransactionLogger.instance) {
      TransactionLogger.instance = new TransactionLogger();
    }
    return TransactionLogger.instance;
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, error?: any) {
    this.log('error', message, error);
  }

  success(message: string, data?: any) {
    this.log('success', message, data);
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? this.sanitizeData(data) : undefined
    };

    this.logs.push(entry);
    
    // Console logging with styling
    const style = this.getConsoleStyle(level);
    console.group(`%c[${level.toUpperCase()}] ${message}`, style);
    
    if (data) {
      if (level === 'error' && data instanceof Error) {
        console.error('Error details:', {
          name: data.name,
          message: data.message,
          stack: data.stack
        });
      } else {
        console.log('Data:', data);
      }
    }
    
    console.groupEnd();

    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      info: 'color: #06B6D4; font-weight: bold;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
      success: 'color: #10B981; font-weight: bold;',
      debug: 'color: #8B5CF6; font-weight: bold;'
    };
    return styles[level];
  }

  private sanitizeData(data: any): any {
    try {
      // Handle circular references and large objects
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (value.constructor.name === 'PublicKey') {
            return value.toString();
          }
          if (value instanceof Uint8Array) {
            return `Uint8Array(${value.length})`;
          }
        }
        return value;
      }));
    } catch (error) {
      return String(data);
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
    console.clear();
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

// Singleton instance export
export const logger = TransactionLogger.getInstance();