// RPC Configuration
export interface RpcConfig {
  endpoint: string;
  name: string;
  network: 'mainnet' | 'devnet' | 'testnet' | 'custom';
}

export const DEFAULT_RPC_ENDPOINTS: RpcConfig[] = [
  {
    endpoint: 'https://go.getblock.us/86aac42ad4484f3c813079afc201451c',
    name: 'GetBlock Mainnet',
    network: 'mainnet'
  },
  {
    endpoint: 'https://solana-mainnet.g.alchemy.com/v2/demo',
    name: 'Alchemy Mainnet',
    network: 'mainnet'
  },
  {
    endpoint: 'https://rpc.ankr.com/solana',
    name: 'Ankr Mainnet',
    network: 'mainnet'
  },
  {
    endpoint: 'https://solana-api.projectserum.com',
    name: 'Project Serum',
    network: 'mainnet'
  },
  {
    endpoint: 'https://api.mainnet-beta.solana.com',
    name: 'Solana Mainnet (Official)',
    network: 'mainnet'
  },
  {
    endpoint: 'https://api.devnet.solana.com',
    name: 'Solana Devnet',
    network: 'devnet'
  }
];

// Get RPC endpoint from localStorage or use default
export const getRpcEndpoint = (): string => {
  if (typeof window !== 'undefined') {
    const savedEndpoint = localStorage.getItem('solana-rpc-endpoint');
    if (savedEndpoint) {
      return savedEndpoint;
    }
  }
  return DEFAULT_RPC_ENDPOINTS[0].endpoint;
};

// Save RPC endpoint to localStorage
export const setRpcEndpoint = (endpoint: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('solana-rpc-endpoint', endpoint);
  }
};

// Get current network based on endpoint
export const getCurrentNetwork = (endpoint: string): RpcConfig['network'] => {
  const config = DEFAULT_RPC_ENDPOINTS.find(rpc => rpc.endpoint === endpoint);
  return config?.network || 'custom';
};