import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Network Context - Manages Network Mode (Like Phantom)
 * 
 * Network modes:
 * - mainnet: Production network
 * - testnet: Devnet for Solana, Sepolia for Ethereum
 * - localhost: Local test validator (http://localhost:8899)
 * - custom: User-defined RPC endpoint
 */

export type NetworkMode = 'mainnet' | 'testnet' | 'localhost' | 'custom';

interface NetworkContextType {
  networkMode: NetworkMode;
  isTestnet: boolean;
  customRpcUrl: string;
  toggleNetwork: () => void;
  setNetworkMode: (mode: NetworkMode) => void;
  setCustomRpcUrl: (url: string) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkMode, setNetworkModeState] = useState<NetworkMode>('mainnet');
  const [customRpcUrl, setCustomRpcUrlState] = useState<string>('');

  // Load network mode and custom RPC from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('saturn_network_mode');
    const savedCustomRpc = localStorage.getItem('saturn_custom_rpc') || '';
    
    if (saved === 'testnet' || saved === 'mainnet' || saved === 'localhost' || saved === 'custom') {
      setNetworkModeState(saved);
      console.log('[Network] 🌐 Loaded network mode:', saved);
    }
    
    if (savedCustomRpc) {
      setCustomRpcUrlState(savedCustomRpc);
      console.log('[Network] 🔧 Loaded custom RPC:', savedCustomRpc);
    }
  }, []);

  // Save network mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('saturn_network_mode', networkMode);
    console.log('[Network] 💾 Network mode changed to:', networkMode);
  }, [networkMode]);

  // Save custom RPC to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('saturn_custom_rpc', customRpcUrl);
    console.log('[Network] 💾 Custom RPC changed to:', customRpcUrl);
  }, [customRpcUrl]);

  const toggleNetwork = () => {
    setNetworkModeState(prev => prev === 'mainnet' ? 'testnet' : 'mainnet');
  };

  const setNetworkMode = (mode: NetworkMode) => {
    setNetworkModeState(mode);
  };

  const setCustomRpcUrl = (url: string) => {
    setCustomRpcUrlState(url);
  };

  const value: NetworkContextType = {
    networkMode,
    isTestnet: networkMode === 'testnet',
    customRpcUrl,
    toggleNetwork,
    setNetworkMode,
    setCustomRpcUrl,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

/**
 * Get RPC endpoints based on network mode
 */
export function getNetworkEndpoints(networkMode: NetworkMode, customRpcUrl?: string) {
  // Localhost mode
  if (networkMode === 'localhost') {
    return {
      solana: {
        name: 'Solana Localhost',
        rpc: 'http://localhost:8899',
        explorer: 'https://explorer.solana.com',
        explorerParam: 'custom&customUrl=http://localhost:8899',
      },
      ethereum: {
        name: 'Ethereum Localhost',
        rpc: 'http://localhost:8545',
        chainId: 1337,
        explorer: 'https://etherscan.io',
      },
      bitcoin: {
        name: 'Bitcoin Localhost',
        explorer: 'https://blockstream.info',
      },
      polygon: {
        name: 'Polygon Localhost',
        rpc: 'http://localhost:8545',
        chainId: 1337,
        explorer: 'https://polygonscan.com',
      },
      base: {
        name: 'Base Localhost',
        rpc: 'http://localhost:8545',
        chainId: 1337,
        explorer: 'https://basescan.org',
      },
    };
  }

  // Custom RPC mode
  if (networkMode === 'custom' && customRpcUrl) {
    return {
      solana: {
        name: 'Custom RPC',
        rpc: customRpcUrl,
        explorer: 'https://explorer.solana.com',
        explorerParam: `custom&customUrl=${encodeURIComponent(customRpcUrl)}`,
      },
      ethereum: {
        name: 'Custom RPC',
        rpc: customRpcUrl,
        chainId: 1,
        explorer: 'https://etherscan.io',
      },
      bitcoin: {
        name: 'Custom RPC',
        explorer: 'https://blockstream.info',
      },
      polygon: {
        name: 'Custom RPC',
        rpc: customRpcUrl,
        chainId: 137,
        explorer: 'https://polygonscan.com',
      },
      base: {
        name: 'Custom RPC',
        rpc: customRpcUrl,
        chainId: 8453,
        explorer: 'https://basescan.org',
      },
    };
  }

  if (networkMode === 'testnet') {
    return {
      solana: {
        name: 'Solana Devnet',
        rpc: 'https://api.devnet.solana.com',
        explorer: 'https://explorer.solana.com',
        explorerParam: 'devnet',
      },
      ethereum: {
        name: 'Sepolia Testnet',
        rpc: 'https://eth-sepolia.g.alchemy.com/v2/',
        chainId: 11155111,
        explorer: 'https://sepolia.etherscan.io',
      },
      bitcoin: {
        name: 'Bitcoin Testnet',
        explorer: 'https://blockstream.info/testnet',
      },
      polygon: {
        name: 'Polygon Mumbai',
        rpc: 'https://polygon-mumbai.g.alchemy.com/v2/',
        chainId: 80001,
        explorer: 'https://mumbai.polygonscan.com',
      },
      base: {
        name: 'Base Sepolia',
        rpc: 'https://base-sepolia.g.alchemy.com/v2/',
        chainId: 84532,
        explorer: 'https://sepolia.basescan.org',
      },
    };
  }

  // Mainnet
  return {
    solana: {
      name: 'Solana Mainnet',
      rpc: 'https://api.mainnet-beta.solana.com',
      explorer: 'https://explorer.solana.com',
      explorerParam: '',
    },
    ethereum: {
      name: 'Ethereum Mainnet',
      rpc: 'https://eth-mainnet.g.alchemy.com/v2/',
      chainId: 1,
      explorer: 'https://etherscan.io',
    },
    bitcoin: {
      name: 'Bitcoin Mainnet',
      explorer: 'https://blockstream.info',
    },
    polygon: {
      name: 'Polygon Mainnet',
      rpc: 'https://polygon-mainnet.g.alchemy.com/v2/',
      chainId: 137,
      explorer: 'https://polygonscan.com',
    },
    base: {
      name: 'Base Mainnet',
      rpc: 'https://base-mainnet.g.alchemy.com/v2/',
      chainId: 8453,
      explorer: 'https://basescan.org',
    },
  };
}