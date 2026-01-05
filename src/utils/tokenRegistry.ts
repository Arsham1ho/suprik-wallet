/**
 * Token Registry - Phantom-like static token list
 * Pre-cached token metadata for instant loading without API calls
 *
 * This eliminates the need to fetch token data from CoinGecko on every load.
 * Token prices are still fetched dynamically, but metadata loads instantly.
 */

export interface TokenMetadata {
  id: string;
  symbol: string;
  name: string;
  image: string;
  decimals: number;
  mint?: string; // Solana mint address
  chainId?: number; // EVM chain ID
  address?: string; // EVM contract address
  coingeckoId: string;
  verified: boolean;
}

// Top 200 tokens pre-cached (like Phantom)
// This list is updated periodically and bundled with the app
export const TOKEN_REGISTRY: TokenMetadata[] = [
  // === TOP CRYPTOCURRENCIES ===
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', decimals: 8, coingeckoId: 'bitcoin', verified: true },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', decimals: 18, coingeckoId: 'ethereum', verified: true },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', decimals: 9, mint: 'So11111111111111111111111111111111111111112', coingeckoId: 'solana', verified: true },
  { id: 'tether', symbol: 'USDT', name: 'Tether', image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', decimals: 6, mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', coingeckoId: 'tether', verified: true },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', decimals: 18, coingeckoId: 'binancecoin', verified: true },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', image: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png', decimals: 6, mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', coingeckoId: 'usd-coin', verified: true },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', decimals: 6, coingeckoId: 'ripple', verified: true },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', decimals: 6, coingeckoId: 'cardano', verified: true },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', decimals: 8, coingeckoId: 'dogecoin', verified: true },
  { id: 'tron', symbol: 'TRX', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', decimals: 6, coingeckoId: 'tron', verified: true },

  // === SOLANA ECOSYSTEM ===
  { id: 'bonk', symbol: 'BONK', name: 'Bonk', image: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg', decimals: 5, mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', coingeckoId: 'bonk', verified: true },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', image: 'https://assets.coingecko.com/coins/images/34188/large/jup.png', decimals: 6, mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', coingeckoId: 'jupiter-exchange-solana', verified: true },
  { id: 'raydium', symbol: 'RAY', name: 'Raydium', image: 'https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg', decimals: 6, mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', coingeckoId: 'raydium', verified: true },
  { id: 'dogwifcoin', symbol: 'WIF', name: 'dogwifhat', image: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg', decimals: 6, mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', coingeckoId: 'dogwifcoin', verified: true },
  { id: 'jito-governance-token', symbol: 'JTO', name: 'Jito', image: 'https://assets.coingecko.com/coins/images/33228/large/jto.png', decimals: 9, mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', coingeckoId: 'jito-governance-token', verified: true },
  { id: 'pyth-network', symbol: 'PYTH', name: 'Pyth Network', image: 'https://assets.coingecko.com/coins/images/31924/large/pyth.png', decimals: 6, mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', coingeckoId: 'pyth-network', verified: true },
  { id: 'render-token', symbol: 'RENDER', name: 'Render', image: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png', decimals: 8, mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', coingeckoId: 'render-token', verified: true },
  { id: 'helium', symbol: 'HNT', name: 'Helium', image: 'https://assets.coingecko.com/coins/images/4284/large/Helium_HNT.png', decimals: 8, mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux', coingeckoId: 'helium', verified: true },
  { id: 'orca', symbol: 'ORCA', name: 'Orca', image: 'https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png', decimals: 6, mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', coingeckoId: 'orca', verified: true },
  { id: 'marinade-staked-sol', symbol: 'MSOL', name: 'Marinade Staked SOL', image: 'https://assets.coingecko.com/coins/images/17752/large/mSOL.png', decimals: 9, mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', coingeckoId: 'marinade-staked-sol', verified: true },
  { id: 'jito-staked-sol', symbol: 'JITOSOL', name: 'Jito Staked SOL', image: 'https://assets.coingecko.com/coins/images/28046/large/JitoSOL-200.png', decimals: 9, mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', coingeckoId: 'jito-staked-sol', verified: true },
  { id: 'wormhole', symbol: 'W', name: 'Wormhole', image: 'https://wormhole.com/token.png', decimals: 6, mint: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', coingeckoId: 'wormhole', verified: true },
  { id: 'popcat', symbol: 'POPCAT', name: 'Popcat', image: 'https://bafkreidvkvuzyslw5jh5z242lgzwzhbi2kxxnpkwoysdp7sszxyi6olywa.ipfs.nftstorage.link/', decimals: 9, mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', coingeckoId: 'popcat', verified: true },
  { id: 'cat-in-a-dogs-world', symbol: 'MEW', name: 'cat in a dogs world', image: 'https://bafkreidlwyr565dxtao2ipsze6bmzpszqzybz7sqi2zaet5fs7k53henju.ipfs.nftstorage.link/', decimals: 5, mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', coingeckoId: 'cat-in-a-dogs-world', verified: true },
  { id: 'book-of-meme', symbol: 'BOME', name: 'BOOK OF MEME', image: 'https://bafkreidrxemu6fhrcmblxy3d25kwa4zyis4gghgpcqplj2u5kp4pvvlyce.ipfs.nftstorage.link/', decimals: 6, mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', coingeckoId: 'book-of-meme', verified: true },

  // === ETHEREUM ECOSYSTEM (using TrustWallet CDN for reliability) ===
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png', decimals: 18, address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', chainId: 1, coingeckoId: 'chainlink', verified: true },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png', decimals: 18, address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', chainId: 1, coingeckoId: 'uniswap', verified: true },
  { id: 'aave', symbol: 'AAVE', name: 'Aave', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png', decimals: 18, address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', chainId: 1, coingeckoId: 'aave', verified: true },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32/logo.png', decimals: 18, address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', chainId: 1, coingeckoId: 'lido-dao', verified: true },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6982508145454Ce325dDbE47a25d4ec3d2311933/logo.png', decimals: 18, address: '0x6982508145454Ce325dDbE47a25d4ec3d2311933', chainId: 1, coingeckoId: 'pepe', verified: true },
  { id: 'shiba-inu', symbol: 'SHIB', name: 'Shiba Inu', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png', decimals: 18, address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', chainId: 1, coingeckoId: 'shiba-inu', verified: true },
  { id: 'wrapped-bitcoin', symbol: 'WBTC', name: 'Wrapped Bitcoin', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png', decimals: 8, address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', chainId: 1, coingeckoId: 'wrapped-bitcoin', verified: true },
  { id: 'dai', symbol: 'DAI', name: 'Dai', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EescdeCB5BE1458D/logo.png', decimals: 18, address: '0x6B175474E89094C44Da98b954EescdeCB5BE1458D', chainId: 1, coingeckoId: 'dai', verified: true },
  { id: 'maker', symbol: 'MKR', name: 'Maker', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png', decimals: 18, address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2', chainId: 1, coingeckoId: 'maker', verified: true },
  { id: 'the-graph', symbol: 'GRT', name: 'The Graph', image: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc944E90C64B2c07662A292be6244BDf05Cda44a7/logo.png', decimals: 18, address: '0xc944E90C64B2c07662A292be6244BDf05Cda44a7', chainId: 1, coingeckoId: 'the-graph', verified: true },

  // === POLYGON ECOSYSTEM ===
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png', decimals: 18, address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', chainId: 1, coingeckoId: 'matic-network', verified: true },
  { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'POL', image: 'https://assets.coingecko.com/coins/images/32440/large/polygon.png', decimals: 18, coingeckoId: 'polygon-ecosystem-token', verified: true },

  // === LAYER 2 ===
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', image: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg', decimals: 18, address: '0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1', chainId: 42161, coingeckoId: 'arbitrum', verified: true },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', image: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png', decimals: 18, address: '0x4200000000000000000000000000000000000042', chainId: 10, coingeckoId: 'optimism', verified: true },
  { id: 'starknet', symbol: 'STRK', name: 'Starknet', image: 'https://assets.coingecko.com/coins/images/26433/large/starknet.png', decimals: 18, coingeckoId: 'starknet', verified: true },

  // === OTHER MAJOR TOKENS ===
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', decimals: 18, coingeckoId: 'avalanche-2', verified: true },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', decimals: 10, coingeckoId: 'polkadot', verified: true },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg', decimals: 24, coingeckoId: 'near', verified: true },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos Hub', image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png', decimals: 6, coingeckoId: 'cosmos', verified: true },
  { id: 'internet-computer', symbol: 'ICP', name: 'Internet Computer', image: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png', decimals: 8, coingeckoId: 'internet-computer', verified: true },
  { id: 'aptos', symbol: 'APT', name: 'Aptos', image: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', decimals: 8, coingeckoId: 'aptos', verified: true },
  { id: 'sui', symbol: 'SUI', name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg', decimals: 9, coingeckoId: 'sui', verified: true },
  { id: 'filecoin', symbol: 'FIL', name: 'Filecoin', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png', decimals: 18, coingeckoId: 'filecoin', verified: true },
  { id: 'hedera-hashgraph', symbol: 'HBAR', name: 'Hedera', image: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png', decimals: 8, coingeckoId: 'hedera-hashgraph', verified: true },
  { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', image: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png', decimals: 18, coingeckoId: 'injective-protocol', verified: true },
  { id: 'immutable-x', symbol: 'IMX', name: 'Immutable', image: 'https://assets.coingecko.com/coins/images/17233/large/immutableX-symbol-BLK-RGB.png', decimals: 18, coingeckoId: 'immutable-x', verified: true },
  { id: 'sei-network', symbol: 'SEI', name: 'Sei', image: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/sei/images/sei.png', decimals: 6, coingeckoId: 'sei-network', verified: true },
  { id: 'celestia', symbol: 'TIA', name: 'Celestia', image: 'https://raw.githubusercontent.com/cosmos/chain-registry/master/celestia/images/celestia.png', decimals: 6, coingeckoId: 'celestia', verified: true },

  // === FEATURED TOKENS ===
  { id: 'parabolic-ai', symbol: 'PARAI', name: 'Parabolic AI', image: 'https://cdn.prod.website-files.com/687ec91a26cd45a89c4d995b/687eca46ea37b541b558369a_PAI_LOGI.png', decimals: 9, mint: 'HrkKngiUavecwte1ZMrdt4H5Qet3cecNUzMoEAgjTAX8', coingeckoId: 'parabolic-ai', verified: true },
  { id: 'suprana', symbol: 'SUPRA', name: 'Suprana', image: 'https://assets.coingecko.com/coins/images/36611/large/suprana.jpg', decimals: 9, mint: 'SupreByajmUdeJGLzvUEUm8W4xv1gF8JBqwYnvG41Dp', coingeckoId: 'suprana', verified: true },

  // === MORE SOLANA MEME TOKENS ===
  { id: 'official-trump', symbol: 'TRUMP', name: 'Official Trump', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fbafybeihnnwto6ek4ousiutxfxacp6eye4xzkd6p6qqtvmxpwhm5xr4tr7a.ipfs.nftstorage.link', decimals: 6, mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN', coingeckoId: 'official-trump', verified: true },
  { id: 'fartcoin', symbol: 'FARTCOIN', name: 'Fartcoin', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmQRfBj5cNBPwMGCvLsZhQCXM7YKHCT7qYnP8k3FLwDw8a', decimals: 9, mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', coingeckoId: 'fartcoin', verified: true },
  { id: 'ai16z', symbol: 'AI16Z', name: 'ai16z', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmPqBvJWLeEtPzXNbLTZCTQYW8ycXrZVdgLbqdupLmBCDD', decimals: 9, mint: 'HeLp6NuQkmYB4pYWo2zYs22mESHXPQYzXbB8n4V98jwC', coingeckoId: 'ai16z', verified: true },
  { id: 'pudgy-penguins', symbol: 'PENGU', name: 'Pudgy Penguins', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Farweave.net%2FYxKn_XgMAzio9P29v4l0s6Z2hXlJxYVyPmLXb7P_y94', decimals: 6, mint: '2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv', coingeckoId: 'pudgy-penguins', verified: true },
  { id: 'peanut-the-squirrel', symbol: 'PNUT', name: 'Peanut the Squirrel', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmXBtR8DVFqHqowtrF3oUYhNZCAzR7VnFwMZUZNfM7FYoP', decimals: 6, mint: '2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump', coingeckoId: 'peanut-the-squirrel', verified: true },
  { id: 'goatseus-maximus', symbol: 'GOAT', name: 'Goatseus Maximus', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmRshyepU5yMYi5Lp2W3S1x7x3AzFkPQmCzTRZqTsptFfL', decimals: 6, mint: 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump', coingeckoId: 'goatseus-maximus', verified: true },
  { id: 'gigachad-2', symbol: 'GIGA', name: 'GIGACHAD', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmYne4Fmf4jNLrB6d7LnKaPZ6S3ynfSpqYtAPKHhP8qBXo', decimals: 5, mint: '63LfDmNb3MQ8mw9MtZ2To9bEA2M71kZUUGq5tiJxcqj9', coingeckoId: 'gigachad-2', verified: true },
  { id: 'moo-deng', symbol: 'MOODENG', name: 'Moo Deng', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmXZoYM2b3wqR5v7f4T9q7oLeBabSq63xsPkMqJz9LqNf5', decimals: 6, mint: 'ED5nyyWEzpPPiWimP8vYm7sD7TD3LAt3Q3gRTWHzPJBY', coingeckoId: 'moo-deng', verified: true },
  { id: 'just-a-chill-guy', symbol: 'CHILLGUY', name: 'Just a chill guy', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fipfs.io%2Fipfs%2FQmRZQeWG3Y5X2sPkZ2TQGsWcXmhY3rSphc9aNFEE4RCKYW', decimals: 6, mint: 'Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump', coingeckoId: 'just-a-chill-guy', verified: true },
  { id: 'spx6900', symbol: 'SPX', name: 'SPX6900', image: 'https://dd.dexscreener.com/ds-data/tokens/solana/J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr.png', decimals: 8, mint: 'J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr', coingeckoId: 'spx6900', verified: true },
  { id: 'grass', symbol: 'GRASS', name: 'Grass', image: 'https://img.fotofolio.xyz/?url=https%3A%2F%2Fsznsqniipnlvvfotyybi.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fgrass%2Fimages%2Fgrass.png', decimals: 9, mint: 'Grass7B4RdKfBCjTKgSqnXkqjwiGvQyFbuSCUJr3XXjs', coingeckoId: 'grass', verified: true },

  // === DEFI TOKENS ===
  { id: 'curve-dao-token', symbol: 'CRV', name: 'Curve DAO Token', image: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png', decimals: 18, coingeckoId: 'curve-dao-token', verified: true },
  { id: 'convex-finance', symbol: 'CVX', name: 'Convex Finance', image: 'https://assets.coingecko.com/coins/images/15585/large/convex.png', decimals: 18, coingeckoId: 'convex-finance', verified: true },
  { id: 'compound-governance-token', symbol: 'COMP', name: 'Compound', image: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png', decimals: 18, coingeckoId: 'compound-governance-token', verified: true },
  { id: 'yearn-finance', symbol: 'YFI', name: 'yearn.finance', image: 'https://assets.coingecko.com/coins/images/11849/large/yearn.jpg', decimals: 18, coingeckoId: 'yearn-finance', verified: true },
  { id: 'sushi', symbol: 'SUSHI', name: 'SushiSwap', image: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png', decimals: 18, coingeckoId: 'sushi', verified: true },
  { id: '1inch', symbol: '1INCH', name: '1inch', image: 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png', decimals: 18, coingeckoId: '1inch', verified: true },
  { id: 'pancakeswap-token', symbol: 'CAKE', name: 'PancakeSwap', image: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo.png', decimals: 18, coingeckoId: 'pancakeswap-token', verified: true },
  { id: 'dydx', symbol: 'DYDX', name: 'dYdX', image: 'https://assets.coingecko.com/coins/images/17500/large/hjnIm9bV.jpg', decimals: 18, coingeckoId: 'dydx', verified: true },
  { id: 'gmx', symbol: 'GMX', name: 'GMX', image: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png', decimals: 18, coingeckoId: 'gmx', verified: true },
  { id: 'frax-share', symbol: 'FXS', name: 'Frax Share', image: 'https://assets.coingecko.com/coins/images/13423/large/Frax_Shares_icon.png', decimals: 18, coingeckoId: 'frax-share', verified: true },
  { id: 'frax', symbol: 'FRAX', name: 'Frax', image: 'https://assets.coingecko.com/coins/images/13422/large/frax_logo.png', decimals: 18, coingeckoId: 'frax', verified: true },
  { id: 'rocket-pool', symbol: 'RPL', name: 'Rocket Pool', image: 'https://assets.coingecko.com/coins/images/2090/large/rocket_pool.png', decimals: 18, coingeckoId: 'rocket-pool', verified: true },
  { id: 'balancer', symbol: 'BAL', name: 'Balancer', image: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png', decimals: 18, coingeckoId: 'balancer', verified: true },
  { id: 'synthetix-network-token', symbol: 'SNX', name: 'Synthetix', image: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png', decimals: 18, coingeckoId: 'havven', verified: true },

  // === AI TOKENS ===
  { id: 'fetch-ai', symbol: 'FET', name: 'Artificial Superintelligence Alliance', image: 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg', decimals: 18, coingeckoId: 'fetch-ai', verified: true },
  { id: 'singularitynet', symbol: 'AGIX', name: 'SingularityNET', image: 'https://assets.coingecko.com/coins/images/2138/large/singularitynet.png', decimals: 8, coingeckoId: 'singularitynet', verified: true },
  { id: 'ocean-protocol', symbol: 'OCEAN', name: 'Ocean Protocol', image: 'https://assets.coingecko.com/coins/images/3687/large/ocean-protocol-logo.jpg', decimals: 18, coingeckoId: 'ocean-protocol', verified: true },
  { id: 'bittensor', symbol: 'TAO', name: 'Bittensor', image: 'https://assets.coingecko.com/coins/images/28452/large/ARUsPeNQ_400x400.jpeg', decimals: 9, coingeckoId: 'bittensor', verified: true },
  { id: 'akash-network', symbol: 'AKT', name: 'Akash Network', image: 'https://assets.coingecko.com/coins/images/12785/large/akash-logo.png', decimals: 6, coingeckoId: 'akash-network', verified: true },

  // === GAMING TOKENS ===
  { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', image: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg', decimals: 18, coingeckoId: 'the-sandbox', verified: true },
  { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', image: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png', decimals: 18, coingeckoId: 'decentraland', verified: true },
  { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', image: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png', decimals: 18, coingeckoId: 'axie-infinity', verified: true },
  { id: 'gala', symbol: 'GALA', name: 'GALA', image: 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png', decimals: 8, coingeckoId: 'gala', verified: true },
  { id: 'enjincoin', symbol: 'ENJ', name: 'Enjin Coin', image: 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png', decimals: 18, coingeckoId: 'enjincoin', verified: true },
  { id: 'illuvium', symbol: 'ILV', name: 'Illuvium', image: 'https://assets.coingecko.com/coins/images/14468/large/logo-200x200.png', decimals: 18, coingeckoId: 'illuvium', verified: true },
  { id: 'ronin', symbol: 'RON', name: 'Ronin', image: 'https://assets.coingecko.com/coins/images/20009/large/Ronin_Mark_Blue.png', decimals: 18, coingeckoId: 'ronin', verified: true },
  { id: 'magic', symbol: 'MAGIC', name: 'MAGIC', image: 'https://assets.coingecko.com/coins/images/18623/large/magic.png', decimals: 18, coingeckoId: 'magic', verified: true },
  { id: 'echelon-prime', symbol: 'PRIME', name: 'Echelon Prime', image: 'https://assets.coingecko.com/coins/images/29053/large/prime-logo-small-border.png', decimals: 18, coingeckoId: 'echelon-prime', verified: true },

  // === OTHER POPULAR TOKENS ===
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', decimals: 8, coingeckoId: 'litecoin', verified: true },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png', decimals: 8, coingeckoId: 'bitcoin-cash', verified: true },
  { id: 'ethereum-classic', symbol: 'ETC', name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png', decimals: 18, coingeckoId: 'ethereum-classic', verified: true },
  { id: 'monero', symbol: 'XMR', name: 'Monero', image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png', decimals: 12, coingeckoId: 'monero', verified: true },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png', decimals: 7, coingeckoId: 'stellar', verified: true },
  { id: 'vechain', symbol: 'VET', name: 'VeChain', image: 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png', decimals: 18, coingeckoId: 'vechain', verified: true },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand', image: 'https://assets.coingecko.com/coins/images/4380/large/download.png', decimals: 6, coingeckoId: 'algorand', verified: true },
  { id: 'quant-network', symbol: 'QNT', name: 'Quant', image: 'https://assets.coingecko.com/coins/images/3370/large/5ZOu7brX_400x400.jpg', decimals: 18, coingeckoId: 'quant-network', verified: true },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', image: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png', decimals: 18, coingeckoId: 'fantom', verified: true },
  { id: 'flow', symbol: 'FLOW', name: 'Flow', image: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png', decimals: 8, coingeckoId: 'flow', verified: true },
  { id: 'theta-token', symbol: 'THETA', name: 'Theta Network', image: 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png', decimals: 18, coingeckoId: 'theta-token', verified: true },
  { id: 'ethereum-name-service', symbol: 'ENS', name: 'Ethereum Name Service', image: 'https://assets.coingecko.com/coins/images/19785/large/acatxTm8_400x400.jpg', decimals: 18, coingeckoId: 'ethereum-name-service', verified: true },
  { id: 'floki', symbol: 'FLOKI', name: 'FLOKI', image: 'https://assets.coingecko.com/coins/images/16746/large/PNG_image.png', decimals: 9, coingeckoId: 'floki', verified: true },
  { id: 'kaspa', symbol: 'KAS', name: 'Kaspa', image: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png', decimals: 8, coingeckoId: 'kaspa', verified: true },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', image: 'https://assets.coingecko.com/coins/images/30980/large/token-logo.png', decimals: 18, coingeckoId: 'mantle', verified: true },
  { id: 'worldcoin', symbol: 'WLD', name: 'Worldcoin', image: 'https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg', decimals: 18, coingeckoId: 'worldcoin-wld', verified: true },
  { id: 'brett', symbol: 'BRETT', name: 'Brett', image: 'https://assets.coingecko.com/coins/images/35529/large/1000050750.png', decimals: 18, coingeckoId: 'brett', verified: true },
  { id: 'notcoin', symbol: 'NOT', name: 'Notcoin', image: 'https://assets.coingecko.com/coins/images/36674/large/notcoin.jpg', decimals: 9, coingeckoId: 'notcoin', verified: true },
  { id: 'dogs-2', symbol: 'DOGS', name: 'DOGS', image: 'https://assets.coingecko.com/coins/images/39365/large/DOGS.png', decimals: 9, coingeckoId: 'dogs-2', verified: true },
  { id: 'hamster-kombat', symbol: 'HMSTR', name: 'Hamster Kombat', image: 'https://assets.coingecko.com/coins/images/39102/large/hamster.png', decimals: 9, coingeckoId: 'hamster-kombat', verified: true },

  // === STABLECOINS ===
  { id: 'true-usd', symbol: 'TUSD', name: 'TrueUSD', image: 'https://assets.coingecko.com/coins/images/3449/large/tusd.png', decimals: 18, coingeckoId: 'true-usd', verified: true },
  { id: 'pax-dollar', symbol: 'USDP', name: 'Pax Dollar', image: 'https://assets.coingecko.com/coins/images/6013/large/Pax_Dollar.png', decimals: 18, coingeckoId: 'pax-dollar', verified: true },
  { id: 'first-digital-usd', symbol: 'FDUSD', name: 'First Digital USD', image: 'https://assets.coingecko.com/coins/images/31079/large/firstdigitalusd.jpg', decimals: 18, coingeckoId: 'first-digital-usd', verified: true },

  // === EXCHANGE TOKENS ===
  { id: 'okb', symbol: 'OKB', name: 'OKB', image: 'https://assets.coingecko.com/coins/images/4463/large/WeChat_Image_20220118095654.png', decimals: 18, coingeckoId: 'okb', verified: true },
  { id: 'kucoin-shares', symbol: 'KCS', name: 'KuCoin Token', image: 'https://assets.coingecko.com/coins/images/1047/large/sa9z79.png', decimals: 6, coingeckoId: 'kucoin-shares', verified: true },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', image: 'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png', decimals: 8, coingeckoId: 'crypto-com-chain', verified: true },
  { id: 'leo-token', symbol: 'LEO', name: 'LEO Token', image: 'https://assets.coingecko.com/coins/images/8418/large/leo-token.png', decimals: 18, coingeckoId: 'leo-token', verified: true },
  { id: 'gate', symbol: 'GT', name: 'Gate', image: 'https://assets.coingecko.com/coins/images/8183/large/gt.png', decimals: 18, coingeckoId: 'gate', verified: true },

  // === MORE LAYER 1/LAYER 2 ===
  { id: 'ton', symbol: 'TON', name: 'Toncoin', image: 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png', decimals: 9, coingeckoId: 'ton', verified: true },
  { id: 'tron', symbol: 'TRX', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', decimals: 6, coingeckoId: 'tron', verified: true },
  { id: 'elrond-erd-2', symbol: 'EGLD', name: 'MultiversX', image: 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png', decimals: 18, coingeckoId: 'elrond-erd-2', verified: true },
  { id: 'eos', symbol: 'EOS', name: 'EOS', image: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png', decimals: 4, coingeckoId: 'eos', verified: true },
  { id: 'neo', symbol: 'NEO', name: 'NEO', image: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png', decimals: 0, coingeckoId: 'neo', verified: true },
  { id: 'zilliqa', symbol: 'ZIL', name: 'Zilliqa', image: 'https://assets.coingecko.com/coins/images/2687/large/Zilliqa-logo.png', decimals: 12, coingeckoId: 'zilliqa', verified: true },
  { id: 'iota', symbol: 'IOTA', name: 'IOTA', image: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png', decimals: 6, coingeckoId: 'iota', verified: true },
  { id: 'klaytn', symbol: 'KLAY', name: 'Klaytn', image: 'https://assets.coingecko.com/coins/images/9672/large/klaytn.png', decimals: 18, coingeckoId: 'klaytn', verified: true },
  { id: 'oasis-network', symbol: 'ROSE', name: 'Oasis Network', image: 'https://assets.coingecko.com/coins/images/13162/large/rose.png', decimals: 18, coingeckoId: 'oasis-network', verified: true },
  { id: 'mina-protocol', symbol: 'MINA', name: 'Mina Protocol', image: 'https://assets.coingecko.com/coins/images/15628/large/JM4_vQ34_400x400.png', decimals: 9, coingeckoId: 'mina-protocol', verified: true },
  { id: 'harmony', symbol: 'ONE', name: 'Harmony', image: 'https://assets.coingecko.com/coins/images/4344/large/Y88JAze.png', decimals: 18, coingeckoId: 'harmony', verified: true },
  { id: 'celo', symbol: 'CELO', name: 'Celo', image: 'https://assets.coingecko.com/coins/images/11090/large/InjsYf7.png', decimals: 18, coingeckoId: 'celo', verified: true },
  { id: 'kava', symbol: 'KAVA', name: 'Kava', image: 'https://assets.coingecko.com/coins/images/9761/large/kava.png', decimals: 6, coingeckoId: 'kava', verified: true },
  { id: 'conflux-token', symbol: 'CFX', name: 'Conflux', image: 'https://assets.coingecko.com/coins/images/13079/large/3vuYMbjN.png', decimals: 18, coingeckoId: 'conflux-token', verified: true },
  { id: 'zcash', symbol: 'ZEC', name: 'Zcash', image: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png', decimals: 8, coingeckoId: 'zcash', verified: true },
  { id: 'dash', symbol: 'DASH', name: 'Dash', image: 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png', decimals: 8, coingeckoId: 'dash', verified: true },
  { id: 'ravencoin', symbol: 'RVN', name: 'Ravencoin', image: 'https://assets.coingecko.com/coins/images/3412/large/ravencoin.png', decimals: 8, coingeckoId: 'ravencoin', verified: true },
  { id: 'decred', symbol: 'DCR', name: 'Decred', image: 'https://assets.coingecko.com/coins/images/329/large/decred.png', decimals: 8, coingeckoId: 'decred', verified: true },
  { id: 'waves', symbol: 'WAVES', name: 'Waves', image: 'https://assets.coingecko.com/coins/images/425/large/waves.png', decimals: 8, coingeckoId: 'waves', verified: true },
  { id: 'stacks', symbol: 'STX', name: 'Stacks', image: 'https://assets.coingecko.com/coins/images/2069/large/Stacks_logo_full.png', decimals: 6, coingeckoId: 'stacks', verified: true },
  { id: 'nervos-network', symbol: 'CKB', name: 'Nervos Network', image: 'https://assets.coingecko.com/coins/images/9566/large/nervos.png', decimals: 8, coingeckoId: 'nervos-network', verified: true },
  { id: 'icon', symbol: 'ICX', name: 'ICON', image: 'https://assets.coingecko.com/coins/images/1060/large/icon-icx-logo.png', decimals: 18, coingeckoId: 'icon', verified: true },
  { id: 'qtum', symbol: 'QTUM', name: 'Qtum', image: 'https://assets.coingecko.com/coins/images/684/large/Qtum_Logo.png', decimals: 8, coingeckoId: 'qtum', verified: true },
  { id: 'ontology', symbol: 'ONT', name: 'Ontology', image: 'https://assets.coingecko.com/coins/images/3447/large/ONT.png', decimals: 0, coingeckoId: 'ontology', verified: true },
  { id: 'wax', symbol: 'WAXP', name: 'WAX', image: 'https://assets.coingecko.com/coins/images/1372/large/WAX_Coin_Tickers_P_512px.png', decimals: 8, coingeckoId: 'wax', verified: true },
  { id: 'syscoin', symbol: 'SYS', name: 'Syscoin', image: 'https://assets.coingecko.com/coins/images/119/large/Syscoin.png', decimals: 8, coingeckoId: 'syscoin', verified: true },
  { id: 'horizen', symbol: 'ZEN', name: 'Horizen', image: 'https://assets.coingecko.com/coins/images/691/large/horizen.png', decimals: 8, coingeckoId: 'horizen', verified: true },
  { id: 'arweave', symbol: 'AR', name: 'Arweave', image: 'https://assets.coingecko.com/coins/images/4343/large/oRt6SiEN_400x400.jpg', decimals: 12, coingeckoId: 'arweave', verified: true },
  { id: 'skale', symbol: 'SKL', name: 'SKALE', image: 'https://assets.coingecko.com/coins/images/13245/large/SKALE_token_300x300.png', decimals: 18, coingeckoId: 'skale', verified: true },
  { id: 'nervos-network', symbol: 'CKB', name: 'Nervos Network', image: 'https://assets.coingecko.com/coins/images/9566/large/nervos.png', decimals: 8, coingeckoId: 'nervos-network', verified: true },
  { id: 'beam-2', symbol: 'BEAM', name: 'Beam', image: 'https://assets.coingecko.com/coins/images/32417/large/chain-logo.png', decimals: 18, coingeckoId: 'beam-2', verified: true },
  { id: 'manta-network', symbol: 'MANTA', name: 'Manta Network', image: 'https://assets.coingecko.com/coins/images/34289/large/manta-logo.png', decimals: 18, coingeckoId: 'manta-network', verified: true },
  { id: 'dymension', symbol: 'DYM', name: 'Dymension', image: 'https://assets.coingecko.com/coins/images/34182/large/dym.png', decimals: 18, coingeckoId: 'dymension', verified: true },
  { id: 'ondo-finance', symbol: 'ONDO', name: 'Ondo', image: 'https://assets.coingecko.com/coins/images/26580/large/ONDO.png', decimals: 18, coingeckoId: 'ondo-finance', verified: true },
  { id: 'ethena', symbol: 'ENA', name: 'Ethena', image: 'https://assets.coingecko.com/coins/images/36530/large/ethena.png', decimals: 18, coingeckoId: 'ethena', verified: true },
  { id: 'ethena-usde', symbol: 'USDE', name: 'USDe', image: 'https://assets.coingecko.com/coins/images/33613/large/usde.png', decimals: 18, coingeckoId: 'ethena-usde', verified: true },
  { id: 'jupiter-perpetuals-liquidity-provider-token', symbol: 'JLP', name: 'Jupiter Perps LP', image: 'https://assets.coingecko.com/coins/images/34188/large/jup.png', decimals: 6, coingeckoId: 'jupiter-perpetuals-liquidity-provider-token', verified: true },
  { id: 'parcl', symbol: 'PRCL', name: 'Parcl', image: 'https://assets.coingecko.com/coins/images/36498/large/parcl.jpg', decimals: 6, coingeckoId: 'parcl', verified: true },
  { id: 'tensor', symbol: 'TNSR', name: 'Tensor', image: 'https://assets.coingecko.com/coins/images/36227/large/tensor.jpg', decimals: 9, coingeckoId: 'tensor', verified: true },
  { id: 'kamino', symbol: 'KMNO', name: 'Kamino', image: 'https://assets.coingecko.com/coins/images/37146/large/kamino.png', decimals: 6, coingeckoId: 'kamino', verified: true },
  { id: 'drift-protocol', symbol: 'DRIFT', name: 'Drift Protocol', image: 'https://assets.coingecko.com/coins/images/38066/large/drift.png', decimals: 6, coingeckoId: 'drift-protocol', verified: true },
  { id: 'io', symbol: 'IO', name: 'io.net', image: 'https://assets.coingecko.com/coins/images/37505/large/io.png', decimals: 8, coingeckoId: 'io', verified: true },
  { id: 'sanctum-2', symbol: 'CLOUD', name: 'Sanctum', image: 'https://assets.coingecko.com/coins/images/38067/large/cloud.png', decimals: 9, coingeckoId: 'sanctum-2', verified: true },
  { id: 'zeta', symbol: 'ZETA', name: 'ZetaChain', image: 'https://assets.coingecko.com/coins/images/34007/large/zeta.png', decimals: 18, coingeckoId: 'zeta', verified: true },
  { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter', image: 'https://assets.coingecko.com/coins/images/34188/large/jup.png', decimals: 6, coingeckoId: 'jupiter-exchange-solana', verified: true },
  { id: 'altlayer', symbol: 'ALT', name: 'AltLayer', image: 'https://assets.coingecko.com/coins/images/34608/large/altlayer.jpeg', decimals: 18, coingeckoId: 'altlayer', verified: true },
  { id: 'pixels', symbol: 'PIXEL', name: 'Pixels', image: 'https://assets.coingecko.com/coins/images/35212/large/pixels.png', decimals: 18, coingeckoId: 'pixels', verified: true },
  { id: 'portal-2', symbol: 'PORTAL', name: 'Portal', image: 'https://assets.coingecko.com/coins/images/35394/large/portal.png', decimals: 18, coingeckoId: 'portal-2', verified: true },
  { id: 'aevo-exchange', symbol: 'AEVO', name: 'Aevo', image: 'https://assets.coingecko.com/coins/images/35179/large/aevo.png', decimals: 18, coingeckoId: 'aevo-exchange', verified: true },
  { id: 'strk', symbol: 'STRK', name: 'Starknet', image: 'https://assets.coingecko.com/coins/images/26433/large/starknet.png', decimals: 18, coingeckoId: 'starknet', verified: true },
  { id: 'saga-2', symbol: 'SAGA', name: 'Saga', image: 'https://assets.coingecko.com/coins/images/36504/large/saga.jpg', decimals: 6, coingeckoId: 'saga-2', verified: true },
  { id: 'omni-network', symbol: 'OMNI', name: 'Omni Network', image: 'https://assets.coingecko.com/coins/images/36465/large/omni.png', decimals: 18, coingeckoId: 'omni-network', verified: true },
  { id: 'renzo', symbol: 'REZ', name: 'Renzo', image: 'https://assets.coingecko.com/coins/images/37327/large/renzo.png', decimals: 18, coingeckoId: 'renzo', verified: true },
  { id: 'lista-dao', symbol: 'LISTA', name: 'Lista DAO', image: 'https://assets.coingecko.com/coins/images/38063/large/lista.jpg', decimals: 18, coingeckoId: 'lista-dao', verified: true },
  { id: 'zklink', symbol: 'ZKL', name: 'zkLink', image: 'https://assets.coingecko.com/coins/images/37285/large/zklink.png', decimals: 18, coingeckoId: 'zklink', verified: true },
  { id: 'polyhedra-network', symbol: 'ZK', name: 'Polyhedra Network', image: 'https://assets.coingecko.com/coins/images/36231/large/polyhedra.jpg', decimals: 18, coingeckoId: 'polyhedra-network', verified: true },
  { id: 'layerzero', symbol: 'ZRO', name: 'LayerZero', image: 'https://assets.coingecko.com/coins/images/38174/large/layerzero.png', decimals: 18, coingeckoId: 'layerzero', verified: true },
  { id: 'blast', symbol: 'BLAST', name: 'Blast', image: 'https://assets.coingecko.com/coins/images/35494/large/blast.jpg', decimals: 18, coingeckoId: 'blast', verified: true },
  { id: 'mode', symbol: 'MODE', name: 'Mode', image: 'https://assets.coingecko.com/coins/images/37243/large/mode.png', decimals: 18, coingeckoId: 'mode', verified: true },
  { id: 'merlin-chain', symbol: 'MERL', name: 'Merlin Chain', image: 'https://assets.coingecko.com/coins/images/36495/large/merlin.png', decimals: 18, coingeckoId: 'merlin-chain', verified: true },
  { id: 'bouncebit', symbol: 'BB', name: 'BounceBit', image: 'https://assets.coingecko.com/coins/images/37417/large/bouncebit.jpeg', decimals: 18, coingeckoId: 'bouncebit', verified: true },
  { id: 'movement', symbol: 'MOVE', name: 'Movement', image: 'https://assets.coingecko.com/coins/images/53031/large/movement.jpg', decimals: 8, coingeckoId: 'movement', verified: true },
  { id: 'hyperliquid', symbol: 'HYPE', name: 'Hyperliquid', image: 'https://assets.coingecko.com/coins/images/52703/large/hyperliquid.jpeg', decimals: 8, coingeckoId: 'hyperliquid', verified: true },
  { id: 'usual', symbol: 'USUAL', name: 'Usual', image: 'https://assets.coingecko.com/coins/images/52304/large/usual.jpg', decimals: 18, coingeckoId: 'usual', verified: true },
  { id: 'virtual-protocol', symbol: 'VIRTUAL', name: 'Virtuals Protocol', image: 'https://assets.coingecko.com/coins/images/36285/large/virtuals.jpeg', decimals: 18, coingeckoId: 'virtual-protocol', verified: true },

  // === MORE SOLANA MEMECOINS ===
  { id: 'slerf', symbol: 'SLERF', name: 'SLERF', image: 'https://assets.coingecko.com/coins/images/36299/large/slerf.jpg', decimals: 9, mint: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3', coingeckoId: 'slerf', verified: true },
  { id: 'wen-4', symbol: 'WEN', name: 'Wen', image: 'https://assets.coingecko.com/coins/images/34856/large/wen.jpg', decimals: 5, mint: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk', coingeckoId: 'wen-4', verified: true },
  { id: 'myro', symbol: 'MYRO', name: 'Myro', image: 'https://assets.coingecko.com/coins/images/32979/large/Myro_token.png', decimals: 9, mint: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4', coingeckoId: 'myro', verified: true },
  { id: 'nosana', symbol: 'NOS', name: 'Nosana', image: 'https://assets.coingecko.com/coins/images/24666/large/nos.png', decimals: 6, mint: 'nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7', coingeckoId: 'nosana', verified: true },
  { id: 'access-protocol', symbol: 'ACS', name: 'Access Protocol', image: 'https://assets.coingecko.com/coins/images/28513/large/ACS.png', decimals: 6, mint: '5MAYDfq5yxtudAhtfyuMBuHZjgAbaS9tbEyEQYAhDS5y', coingeckoId: 'access-protocol', verified: true },
  { id: 'sharky-fi', symbol: 'SHARK', name: 'Sharky', image: 'https://assets.coingecko.com/coins/images/36428/large/sharky.png', decimals: 6, mint: 'SHARKSYJjqaNyxVfrpnBN9pWgPiLFuQFSGhAZ4j5gLe1', coingeckoId: 'sharky-fi', verified: true },
  { id: 'hawksight', symbol: 'HAWK', name: 'Hawksight', image: 'https://assets.coingecko.com/coins/images/35953/large/hawksight.png', decimals: 6, mint: 'BKipkearSqAUdNKa1WDstvcMjoPsSKBuNyvKDQDDu9WE', coingeckoId: 'hawksight', verified: true },
  { id: 'degods', symbol: 'DUST', name: 'DUST Protocol', image: 'https://assets.coingecko.com/coins/images/24428/large/dust.jpg', decimals: 9, mint: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ', coingeckoId: 'degods', verified: true },
  { id: 'aurory', symbol: 'AURY', name: 'Aurory', image: 'https://assets.coingecko.com/coins/images/19324/large/logo.png', decimals: 9, mint: 'AURYydfxJib1ZkTir1Jn1J9ECYUtjb6rKQVmtYaixWPP', coingeckoId: 'aurory', verified: true },
  { id: 'genopets', symbol: 'GENE', name: 'Genopets', image: 'https://assets.coingecko.com/coins/images/24709/large/gene.png', decimals: 9, mint: 'GENEtH5amGSi8kHAtQoezp1XvohRhWCBYvb5PXEmN9sN', coingeckoId: 'genopets', verified: true },
  { id: 'star-atlas', symbol: 'ATLAS', name: 'Star Atlas', image: 'https://assets.coingecko.com/coins/images/17659/large/Icon_Reverse.png', decimals: 8, mint: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx', coingeckoId: 'star-atlas', verified: true },
  { id: 'star-atlas-dao', symbol: 'POLIS', name: 'Star Atlas DAO', image: 'https://assets.coingecko.com/coins/images/17789/large/POLIS.jpg', decimals: 8, mint: 'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk', coingeckoId: 'star-atlas-dao', verified: true },
  { id: 'solend', symbol: 'SLND', name: 'Solend', image: 'https://assets.coingecko.com/coins/images/20655/large/solend-logo.png', decimals: 6, mint: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp', coingeckoId: 'solend', verified: true },
  { id: 'mango-markets', symbol: 'MNGO', name: 'Mango', image: 'https://assets.coingecko.com/coins/images/16217/large/mango.png', decimals: 6, mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', coingeckoId: 'mango-markets', verified: true },
  { id: 'saber', symbol: 'SBR', name: 'Saber', image: 'https://assets.coingecko.com/coins/images/17162/large/saber_token_icon.png', decimals: 6, mint: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1', coingeckoId: 'saber', verified: true },
  { id: 'port-finance', symbol: 'PORT', name: 'Port Finance', image: 'https://assets.coingecko.com/coins/images/17910/large/PORT.png', decimals: 6, mint: 'PoRTjZMPXb9T7dyU7tpLEZRQj7e6ssfAE62j2oQuc6y', coingeckoId: 'port-finance', verified: true },
  { id: 'tulip-protocol', symbol: 'TULIP', name: 'Tulip Protocol', image: 'https://assets.coingecko.com/coins/images/16285/large/tulip.png', decimals: 6, mint: 'TuLipcqtGVXP9XR62wM8WWCm6a9vhLs7T1uoWBk6FDs', coingeckoId: 'tulip-protocol', verified: true },
  { id: 'marinade', symbol: 'MNDE', name: 'Marinade', image: 'https://assets.coingecko.com/coins/images/18867/large/marinade.PNG', decimals: 9, mint: 'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey', coingeckoId: 'marinade', verified: true },
  { id: 'samoyedcoin', symbol: 'SAMO', name: 'Samoyedcoin', image: 'https://assets.coingecko.com/coins/images/15051/large/IXeEj5e.png', decimals: 9, mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', coingeckoId: 'samoyedcoin', verified: true },
  { id: 'cope', symbol: 'COPE', name: 'COPE', image: 'https://assets.coingecko.com/coins/images/14557/large/COPE.png', decimals: 6, mint: '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh', coingeckoId: 'cope', verified: true },
  { id: 'bonfida', symbol: 'FIDA', name: 'Bonfida', image: 'https://assets.coingecko.com/coins/images/13395/large/bonfida.png', decimals: 6, mint: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp', coingeckoId: 'bonfida', verified: true },
  { id: 'oxygen', symbol: 'OXY', name: 'Oxygen', image: 'https://assets.coingecko.com/coins/images/13509/large/8DjBZ79V_400x400.jpg', decimals: 6, mint: 'z3dn17yLaGMKffVogeFHQ9zWVcXgqgf3PQnDsNs2g6M', coingeckoId: 'oxygen', verified: true },
  { id: 'maps', symbol: 'MAPS', name: 'MAPS', image: 'https://assets.coingecko.com/coins/images/13635/large/MAPS.png', decimals: 6, mint: 'MAPS41MDahZ9QdKXhVa4dWB9RuyfV4XqhyAZ8XcYepb', coingeckoId: 'maps', verified: true },
  { id: 'media-network', symbol: 'MEDIA', name: 'Media Network', image: 'https://assets.coingecko.com/coins/images/15142/large/media.png', decimals: 6, mint: 'ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs', coingeckoId: 'media-network', verified: true },
  { id: 'liq-protocol', symbol: 'LIQ', name: 'LIQ Protocol', image: 'https://assets.coingecko.com/coins/images/16534/large/liq-logo-200x200.png', decimals: 6, mint: '4wjPQJ6PrkC4dHhYghwJzGBVP78DkBzA2U3kHoFNBuhj', coingeckoId: 'liq-protocol', verified: true },
  { id: 'sunny-aggregator', symbol: 'SUNNY', name: 'Sunny Aggregator', image: 'https://assets.coingecko.com/coins/images/18039/large/Sunny.png', decimals: 6, mint: 'SUNNYWgPQmFxe9wTZzNK7iPnJ3vYDrkgnxJRJm1s3ag', coingeckoId: 'sunny-aggregator', verified: true },

  // === MORE DEFI & INFRASTRUCTURE ===
  { id: 'uma', symbol: 'UMA', name: 'UMA', image: 'https://assets.coingecko.com/coins/images/10951/large/UMA.png', decimals: 18, coingeckoId: 'uma', verified: true },
  { id: 'api3', symbol: 'API3', name: 'API3', image: 'https://assets.coingecko.com/coins/images/13256/large/api3.jpg', decimals: 18, coingeckoId: 'api3', verified: true },
  { id: 'band-protocol', symbol: 'BAND', name: 'Band Protocol', image: 'https://assets.coingecko.com/coins/images/9545/large/Band_token_blue_violet_token.png', decimals: 18, coingeckoId: 'band-protocol', verified: true },
  { id: 'tellor', symbol: 'TRB', name: 'Tellor', image: 'https://assets.coingecko.com/coins/images/9644/large/Tellor.png', decimals: 18, coingeckoId: 'tellor', verified: true },
  { id: 'request-network', symbol: 'REQ', name: 'Request', image: 'https://assets.coingecko.com/coins/images/1031/large/Request_icon_green.png', decimals: 18, coingeckoId: 'request-network', verified: true },
  { id: 'nucypher', symbol: 'NU', name: 'NuCypher', image: 'https://assets.coingecko.com/coins/images/3318/large/photo1198982838879365035.jpg', decimals: 18, coingeckoId: 'nucypher', verified: true },
  { id: 'keep-network', symbol: 'KEEP', name: 'Keep Network', image: 'https://assets.coingecko.com/coins/images/3373/large/keepnetwork.png', decimals: 18, coingeckoId: 'keep-network', verified: true },
  { id: 'ren', symbol: 'REN', name: 'Ren', image: 'https://assets.coingecko.com/coins/images/3139/large/REN.png', decimals: 18, coingeckoId: 'ren', verified: true },
  { id: 'loopring', symbol: 'LRC', name: 'Loopring', image: 'https://assets.coingecko.com/coins/images/913/large/LRC.png', decimals: 18, coingeckoId: 'loopring', verified: true },
  { id: 'kyber-network-crystal', symbol: 'KNC', name: 'Kyber Network Crystal', image: 'https://assets.coingecko.com/coins/images/14899/large/RwdVsGcw_400x400.jpg', decimals: 18, coingeckoId: 'kyber-network-crystal', verified: true },
  { id: 'ribbon-finance', symbol: 'RBN', name: 'Ribbon Finance', image: 'https://assets.coingecko.com/coins/images/15823/large/RBN_64x64.png', decimals: 18, coingeckoId: 'ribbon-finance', verified: true },
  { id: 'pendle', symbol: 'PENDLE', name: 'Pendle', image: 'https://assets.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png', decimals: 18, coingeckoId: 'pendle', verified: true },
  { id: 'morpho', symbol: 'MORPHO', name: 'Morpho', image: 'https://assets.coingecko.com/coins/images/37984/large/morpho.png', decimals: 18, coingeckoId: 'morpho', verified: true },
  { id: 'eigenlayer', symbol: 'EIGEN', name: 'Eigenlayer', image: 'https://assets.coingecko.com/coins/images/37984/large/eigenlayer.png', decimals: 18, coingeckoId: 'eigenlayer', verified: true },
  { id: 'badger-dao', symbol: 'BADGER', name: 'Badger DAO', image: 'https://assets.coingecko.com/coins/images/13287/large/badger_dao_logo.jpg', decimals: 18, coingeckoId: 'badger-dao', verified: true },
  { id: 'harvest-finance', symbol: 'FARM', name: 'Harvest Finance', image: 'https://assets.coingecko.com/coins/images/12304/large/Harvest.png', decimals: 18, coingeckoId: 'harvest-finance', verified: true },
  { id: 'alpha-finance', symbol: 'ALPHA', name: 'Alpha Venture DAO', image: 'https://assets.coingecko.com/coins/images/12738/large/AlphaToken_256x256.png', decimals: 18, coingeckoId: 'alpha-finance', verified: true },
  { id: 'dodo', symbol: 'DODO', name: 'DODO', image: 'https://assets.coingecko.com/coins/images/12651/large/dodo_logo.png', decimals: 18, coingeckoId: 'dodo', verified: true },
  { id: 'thorchain', symbol: 'RUNE', name: 'THORChain', image: 'https://assets.coingecko.com/coins/images/6595/large/Rune200x200.png', decimals: 8, coingeckoId: 'thorchain', verified: true },
  { id: 'secret', symbol: 'SCRT', name: 'Secret', image: 'https://assets.coingecko.com/coins/images/11871/large/Secret.png', decimals: 6, coingeckoId: 'secret', verified: true },
  { id: 'persistence', symbol: 'XPRT', name: 'Persistence', image: 'https://assets.coingecko.com/coins/images/14582/large/XPRT.png', decimals: 6, coingeckoId: 'persistence', verified: true },
  { id: 'osmosis', symbol: 'OSMO', name: 'Osmosis', image: 'https://assets.coingecko.com/coins/images/16724/large/osmo.png', decimals: 6, coingeckoId: 'osmosis', verified: true },
  { id: 'juno-network', symbol: 'JUNO', name: 'Juno', image: 'https://assets.coingecko.com/coins/images/19249/large/juno.png', decimals: 6, coingeckoId: 'juno-network', verified: true },
  { id: 'stride', symbol: 'STRD', name: 'Stride', image: 'https://assets.coingecko.com/coins/images/27275/large/stride.png', decimals: 6, coingeckoId: 'stride', verified: true },

  // === PRIVACY COINS ===
  { id: 'havven', symbol: 'SNX', name: 'Synthetix', image: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png', decimals: 18, coingeckoId: 'havven', verified: true },
  { id: 'basic-attention-token', symbol: 'BAT', name: 'Basic Attention', image: 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png', decimals: 18, coingeckoId: 'basic-attention-token', verified: true },
  { id: 'storj', symbol: 'STORJ', name: 'Storj', image: 'https://assets.coingecko.com/coins/images/949/large/storj.png', decimals: 8, coingeckoId: 'storj', verified: true },
  { id: 'ankr', symbol: 'ANKR', name: 'Ankr', image: 'https://assets.coingecko.com/coins/images/4324/large/U85xTl2.png', decimals: 18, coingeckoId: 'ankr', verified: true },
  { id: 'livepeer', symbol: 'LPT', name: 'Livepeer', image: 'https://assets.coingecko.com/coins/images/7137/large/logo-circle-green.png', decimals: 18, coingeckoId: 'livepeer', verified: true },
  { id: 'civic', symbol: 'CVC', name: 'Civic', image: 'https://assets.coingecko.com/coins/images/788/large/civic.png', decimals: 8, coingeckoId: 'civic', verified: true },
  { id: 'numeraire', symbol: 'NMR', name: 'Numeraire', image: 'https://assets.coingecko.com/coins/images/752/large/numeraire.png', decimals: 18, coingeckoId: 'numeraire', verified: true },
  { id: 'orchid-protocol', symbol: 'OXT', name: 'Orchid', image: 'https://assets.coingecko.com/coins/images/10244/large/Orchid_OXT_Icon.png', decimals: 18, coingeckoId: 'orchid-protocol', verified: true },
  { id: 'cartesi', symbol: 'CTSI', name: 'Cartesi', image: 'https://assets.coingecko.com/coins/images/11038/large/cartesi.png', decimals: 18, coingeckoId: 'cartesi', verified: true },
  { id: 'coti', symbol: 'COTI', name: 'COTI', image: 'https://assets.coingecko.com/coins/images/2962/large/Coti.png', decimals: 18, coingeckoId: 'coti', verified: true },
  { id: 'adventure-gold', symbol: 'AGLD', name: 'Adventure Gold', image: 'https://assets.coingecko.com/coins/images/18125/large/lpgblc4h_400x400.jpg', decimals: 18, coingeckoId: 'adventure-gold', verified: true },
  { id: 'mask-network', symbol: 'MASK', name: 'Mask Network', image: 'https://assets.coingecko.com/coins/images/14051/large/Mask_Network.jpg', decimals: 18, coingeckoId: 'mask-network', verified: true },
  { id: 'blur', symbol: 'BLUR', name: 'Blur', image: 'https://assets.coingecko.com/coins/images/28453/large/blur.png', decimals: 18, coingeckoId: 'blur', verified: true },
  { id: 'apecoin', symbol: 'APE', name: 'ApeCoin', image: 'https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg', decimals: 18, coingeckoId: 'apecoin', verified: true },
  { id: 'biconomy', symbol: 'BICO', name: 'Biconomy', image: 'https://assets.coingecko.com/coins/images/21061/large/biconomy.jpg', decimals: 18, coingeckoId: 'biconomy', verified: true },
  { id: 'safe', symbol: 'SAFE', name: 'Safe', image: 'https://assets.coingecko.com/coins/images/28034/large/safe.png', decimals: 18, coingeckoId: 'safe', verified: true },
  { id: 'cow-protocol', symbol: 'COW', name: 'CoW Protocol', image: 'https://assets.coingecko.com/coins/images/24384/large/cow.png', decimals: 18, coingeckoId: 'cow-protocol', verified: true },
  { id: 'ssv-network', symbol: 'SSV', name: 'ssv.network', image: 'https://assets.coingecko.com/coins/images/19155/large/ssv.png', decimals: 18, coingeckoId: 'ssv-network', verified: true },
  { id: 'gnosis', symbol: 'GNO', name: 'Gnosis', image: 'https://assets.coingecko.com/coins/images/662/large/logo_square_simple_300px.png', decimals: 18, coingeckoId: 'gnosis', verified: true },
  { id: 'radix', symbol: 'XRD', name: 'Radix', image: 'https://assets.coingecko.com/coins/images/4374/large/Radix.png', decimals: 18, coingeckoId: 'radix', verified: true },

  // === GAMING & METAVERSE ===
  { id: 'the-sandbox', symbol: 'SAND', name: 'The Sandbox', image: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg', decimals: 18, coingeckoId: 'the-sandbox', verified: true },
  { id: 'decentraland', symbol: 'MANA', name: 'Decentraland', image: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png', decimals: 18, coingeckoId: 'decentraland', verified: true },
  { id: 'axie-infinity', symbol: 'AXS', name: 'Axie Infinity', image: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png', decimals: 18, coingeckoId: 'axie-infinity', verified: true },
  { id: 'enjincoin', symbol: 'ENJ', name: 'Enjin Coin', image: 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png', decimals: 18, coingeckoId: 'enjincoin', verified: true },
  { id: 'illuvium', symbol: 'ILV', name: 'Illuvium', image: 'https://assets.coingecko.com/coins/images/14468/large/logo-200x200.png', decimals: 18, coingeckoId: 'illuvium', verified: true },
  { id: 'gala', symbol: 'GALA', name: 'GALA', image: 'https://assets.coingecko.com/coins/images/12493/large/GALA-COINGECKO.png', decimals: 8, coingeckoId: 'gala', verified: true },
  { id: 'ultra', symbol: 'UOS', name: 'Ultra', image: 'https://assets.coingecko.com/coins/images/4480/large/Ultra.png', decimals: 4, coingeckoId: 'ultra', verified: true },
  { id: 'gods-unchained', symbol: 'GODS', name: 'Gods Unchained', image: 'https://assets.coingecko.com/coins/images/17139/large/10631.png', decimals: 18, coingeckoId: 'gods-unchained', verified: true },
  { id: 'yield-guild-games', symbol: 'YGG', name: 'Yield Guild Games', image: 'https://assets.coingecko.com/coins/images/17358/large/le1nzlO6_400x400.jpg', decimals: 18, coingeckoId: 'yield-guild-games', verified: true },
  { id: 'magic', symbol: 'MAGIC', name: 'Magic', image: 'https://assets.coingecko.com/coins/images/18623/large/magic.png', decimals: 18, coingeckoId: 'magic', verified: true },
  { id: 'echelon-prime', symbol: 'PRIME', name: 'Echelon Prime', image: 'https://assets.coingecko.com/coins/images/29053/large/prime-logo-small-border_%282%29.png', decimals: 18, coingeckoId: 'echelon-prime', verified: true },
  { id: 'wilder-world', symbol: 'WILD', name: 'Wilder World', image: 'https://assets.coingecko.com/coins/images/15407/large/wilder-world.png', decimals: 18, coingeckoId: 'wilder-world', verified: true },
  { id: 'superverse', symbol: 'SUPER', name: 'SuperVerse', image: 'https://assets.coingecko.com/coins/images/14040/large/6YKpAt5a_400x400.jpg', decimals: 18, coingeckoId: 'superverse', verified: true },
  { id: 'merit-circle', symbol: 'MC', name: 'Merit Circle', image: 'https://assets.coingecko.com/coins/images/19304/large/Db4XqML.png', decimals: 18, coingeckoId: 'merit-circle', verified: true },
  { id: 'vulcan-forged', symbol: 'PYR', name: 'Vulcan Forged', image: 'https://assets.coingecko.com/coins/images/14770/large/1617088937196.png', decimals: 18, coingeckoId: 'vulcan-forged', verified: true },

  // === AI & DATA TOKENS ===
  { id: 'fetch-ai', symbol: 'FET', name: 'Artificial Superintelligence Alliance', image: 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg', decimals: 18, coingeckoId: 'fetch-ai', verified: true },
  { id: 'singularitynet', symbol: 'AGIX', name: 'SingularityNET', image: 'https://assets.coingecko.com/coins/images/2138/large/singularitynet.png', decimals: 8, coingeckoId: 'singularitynet', verified: true },
  { id: 'ocean-protocol', symbol: 'OCEAN', name: 'Ocean Protocol', image: 'https://assets.coingecko.com/coins/images/3687/large/ocean-protocol-logo.jpg', decimals: 18, coingeckoId: 'ocean-protocol', verified: true },
  { id: 'worldcoin-wld', symbol: 'WLD', name: 'Worldcoin', image: 'https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg', decimals: 18, coingeckoId: 'worldcoin-wld', verified: true },
  { id: 'akash-network', symbol: 'AKT', name: 'Akash Network', image: 'https://assets.coingecko.com/coins/images/12785/large/akash-logo.png', decimals: 6, coingeckoId: 'akash-network', verified: true },
  { id: 'bittensor', symbol: 'TAO', name: 'Bittensor', image: 'https://assets.coingecko.com/coins/images/28452/large/ARUsPeNQ_400x400.jpeg', decimals: 9, coingeckoId: 'bittensor', verified: true },
  { id: 'arkham', symbol: 'ARKM', name: 'Arkham', image: 'https://assets.coingecko.com/coins/images/30929/large/Arkham_Logo_CG.png', decimals: 18, coingeckoId: 'arkham', verified: true },
  { id: 'openfabric-ai', symbol: 'OFN', name: 'Openfabric AI', image: 'https://assets.coingecko.com/coins/images/38147/large/ofn.png', decimals: 18, coingeckoId: 'openfabric-ai', verified: true },
  { id: 'grass', symbol: 'GRASS', name: 'Grass', image: 'https://assets.coingecko.com/coins/images/40433/large/grass.png', decimals: 9, coingeckoId: 'grass', verified: true },
  { id: 'griffain', symbol: 'GRIFFAIN', name: 'Griffain', image: 'https://assets.coingecko.com/coins/images/52549/large/griffain.png', decimals: 6, coingeckoId: 'griffain', verified: true },

  // === EXCHANGE TOKENS ===
  { id: 'ftx-token', symbol: 'FTT', name: 'FTX Token', image: 'https://assets.coingecko.com/coins/images/4195/large/FTT.png', decimals: 18, coingeckoId: 'ftx-token', verified: true },
  { id: 'crypto-com-chain', symbol: 'CRO', name: 'Cronos', image: 'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png', decimals: 8, coingeckoId: 'crypto-com-chain', verified: true },
  { id: 'kucoin-shares', symbol: 'KCS', name: 'KuCoin Token', image: 'https://assets.coingecko.com/coins/images/1047/large/sa9z79.png', decimals: 6, coingeckoId: 'kucoin-shares', verified: true },
  { id: 'okb', symbol: 'OKB', name: 'OKB', image: 'https://assets.coingecko.com/coins/images/4463/large/WeChat_Image_20220118095654.png', decimals: 18, coingeckoId: 'okb', verified: true },
  { id: 'huobi-token', symbol: 'HT', name: 'Huobi Token', image: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png', decimals: 18, coingeckoId: 'huobi-token', verified: true },
  { id: 'bitget-token', symbol: 'BGB', name: 'Bitget Token', image: 'https://assets.coingecko.com/coins/images/11610/large/bitget_token_logo.png', decimals: 18, coingeckoId: 'bitget-token', verified: true },
  { id: 'mx-token', symbol: 'MX', name: 'MX Token', image: 'https://assets.coingecko.com/coins/images/8545/large/MEXC_GLOBAL_LOGO.jpeg', decimals: 18, coingeckoId: 'mx-token', verified: true },
  { id: 'gate', symbol: 'GT', name: 'GateToken', image: 'https://assets.coingecko.com/coins/images/8183/large/gt.png', decimals: 18, coingeckoId: 'gate', verified: true },

  // === MORE STABLECOINS ===
  { id: 'first-digital-usd', symbol: 'FDUSD', name: 'First Digital USD', image: 'https://assets.coingecko.com/coins/images/31079/large/firstdigitalusd.jpeg', decimals: 18, coingeckoId: 'first-digital-usd', verified: true },
  { id: 'paxos-standard', symbol: 'USDP', name: 'Pax Dollar', image: 'https://assets.coingecko.com/coins/images/6013/large/Pax_Dollar.png', decimals: 18, coingeckoId: 'paxos-standard', verified: true },
  { id: 'gemini-dollar', symbol: 'GUSD', name: 'Gemini Dollar', image: 'https://assets.coingecko.com/coins/images/5992/large/gemini-dollar-gusd.png', decimals: 2, coingeckoId: 'gemini-dollar', verified: true },
  { id: 'frax', symbol: 'FRAX', name: 'Frax', image: 'https://assets.coingecko.com/coins/images/13422/large/FRAX_icon.png', decimals: 18, coingeckoId: 'frax', verified: true },
  { id: 'frax-share', symbol: 'FXS', name: 'Frax Share', image: 'https://assets.coingecko.com/coins/images/13423/large/Frax_Shares_icon.png', decimals: 18, coingeckoId: 'frax-share', verified: true },
  { id: 'liquity-usd', symbol: 'LUSD', name: 'Liquity USD', image: 'https://assets.coingecko.com/coins/images/14666/large/Group_3.png', decimals: 18, coingeckoId: 'liquity-usd', verified: true },
  { id: 'liquity', symbol: 'LQTY', name: 'Liquity', image: 'https://assets.coingecko.com/coins/images/14665/large/200-lqty-icon.png', decimals: 18, coingeckoId: 'liquity', verified: true },
  { id: 'paypal-usd', symbol: 'PYUSD', name: 'PayPal USD', image: 'https://assets.coingecko.com/coins/images/31212/large/PYUSD_Logo_%282%29.png', decimals: 6, coingeckoId: 'paypal-usd', verified: true },
  { id: 'trueusd', symbol: 'TUSD', name: 'TrueUSD', image: 'https://assets.coingecko.com/coins/images/3449/large/tusd.png', decimals: 18, coingeckoId: 'trueusd', verified: true },

  // === ADDITIONAL LAYER 1s ===
  { id: 'kaspa', symbol: 'KAS', name: 'Kaspa', image: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png', decimals: 8, coingeckoId: 'kaspa', verified: true },
  { id: 'mantle', symbol: 'MNT', name: 'Mantle', image: 'https://assets.coingecko.com/coins/images/30980/large/token-logo.png', decimals: 18, coingeckoId: 'mantle', verified: true },
  { id: 'elrond-erd-2', symbol: 'EGLD', name: 'MultiversX', image: 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png', decimals: 18, coingeckoId: 'elrond-erd-2', verified: true },
  { id: 'algorand', symbol: 'ALGO', name: 'Algorand', image: 'https://assets.coingecko.com/coins/images/4380/large/download.png', decimals: 6, coingeckoId: 'algorand', verified: true },
  { id: 'vechain', symbol: 'VET', name: 'VeChain', image: 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png', decimals: 18, coingeckoId: 'vechain', verified: true },
  { id: 'eos', symbol: 'EOS', name: 'EOS', image: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png', decimals: 4, coingeckoId: 'eos', verified: true },
  { id: 'flow', symbol: 'FLOW', name: 'Flow', image: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png', decimals: 8, coingeckoId: 'flow', verified: true },
  { id: 'theta-token', symbol: 'THETA', name: 'Theta Network', image: 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png', decimals: 18, coingeckoId: 'theta-token', verified: true },
  { id: 'tezos', symbol: 'XTZ', name: 'Tezos', image: 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png', decimals: 6, coingeckoId: 'tezos', verified: true },
  { id: 'fantom', symbol: 'FTM', name: 'Fantom', image: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png', decimals: 18, coingeckoId: 'fantom', verified: true },
  { id: 'astar', symbol: 'ASTR', name: 'Astar', image: 'https://assets.coingecko.com/coins/images/22617/large/astr.png', decimals: 18, coingeckoId: 'astar', verified: true },
  { id: 'moonbeam', symbol: 'GLMR', name: 'Moonbeam', image: 'https://assets.coingecko.com/coins/images/22459/large/glmr.png', decimals: 18, coingeckoId: 'moonbeam', verified: true },
  { id: 'harmony', symbol: 'ONE', name: 'Harmony', image: 'https://assets.coingecko.com/coins/images/4344/large/Y88JAze.png', decimals: 18, coingeckoId: 'harmony', verified: true },
  { id: 'zilliqa', symbol: 'ZIL', name: 'Zilliqa', image: 'https://assets.coingecko.com/coins/images/2687/large/Zilliqa-logo.png', decimals: 12, coingeckoId: 'zilliqa', verified: true },

  // === MORE 2024 TOKENS ===
  { id: 'jupiter-exchange-solana-jup', symbol: 'JUP', name: 'Jupiter', image: 'https://assets.coingecko.com/coins/images/34188/large/jup.png', decimals: 6, coingeckoId: 'jupiter-exchange-solana', verified: true },
  { id: 'ethena-staked-usde', symbol: 'SUSDE', name: 'Staked USDe', image: 'https://assets.coingecko.com/coins/images/35177/large/susde.png', decimals: 18, coingeckoId: 'ethena-staked-usde', verified: true },
  { id: 'mantra-dao', symbol: 'OM', name: 'MANTRA', image: 'https://assets.coingecko.com/coins/images/12151/large/OM_3D_whtbg.png', decimals: 18, coingeckoId: 'mantra-dao', verified: true },
  { id: 'helium-mobile', symbol: 'MOBILE', name: 'Helium Mobile', image: 'https://assets.coingecko.com/coins/images/29357/large/mobile.png', decimals: 6, mint: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6', coingeckoId: 'helium-mobile', verified: true },
  { id: 'helium-iot', symbol: 'IOT', name: 'Helium IOT', image: 'https://assets.coingecko.com/coins/images/29361/large/iot.png', decimals: 6, mint: 'iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns', coingeckoId: 'helium-iot', verified: true },
  { id: 'bitcoin-cash', symbol: 'BCH', name: 'Bitcoin Cash', image: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png', decimals: 8, coingeckoId: 'bitcoin-cash', verified: true },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', decimals: 8, coingeckoId: 'litecoin', verified: true },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png', decimals: 7, coingeckoId: 'stellar', verified: true },
  { id: 'monero', symbol: 'XMR', name: 'Monero', image: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png', decimals: 12, coingeckoId: 'monero', verified: true },
];

// Quick lookup maps
export const TOKEN_BY_ID = new Map<string, TokenMetadata>(
  TOKEN_REGISTRY.map(t => [t.id, t])
);

export const TOKEN_BY_SYMBOL = new Map<string, TokenMetadata>(
  TOKEN_REGISTRY.map(t => [t.symbol.toUpperCase(), t])
);

export const TOKEN_BY_MINT = new Map<string, TokenMetadata>(
  TOKEN_REGISTRY.filter(t => t.mint).map(t => [t.mint!, t])
);

export const TOKEN_BY_ADDRESS = new Map<string, TokenMetadata>(
  TOKEN_REGISTRY.filter(t => t.address).map(t => [t.address!.toLowerCase(), t])
);

/**
 * Get token metadata by any identifier (id, symbol, mint, address)
 */
export function getTokenMetadata(identifier: string): TokenMetadata | undefined {
  const upperIdentifier = identifier.toUpperCase();
  const lowerIdentifier = identifier.toLowerCase();

  return TOKEN_BY_ID.get(identifier)
    || TOKEN_BY_SYMBOL.get(upperIdentifier)
    || TOKEN_BY_MINT.get(identifier)
    || TOKEN_BY_ADDRESS.get(lowerIdentifier);
}

/**
 * Get all Solana tokens from registry
 */
export function getSolanaTokens(): TokenMetadata[] {
  return TOKEN_REGISTRY.filter(t => t.mint);
}

/**
 * Get all EVM tokens from registry
 */
export function getEVMTokens(chainId?: number): TokenMetadata[] {
  if (chainId) {
    return TOKEN_REGISTRY.filter(t => t.chainId === chainId);
  }
  return TOKEN_REGISTRY.filter(t => t.address);
}

/**
 * Search tokens by name or symbol
 */
export function searchTokens(query: string): TokenMetadata[] {
  const lowerQuery = query.toLowerCase();
  return TOKEN_REGISTRY.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.symbol.toLowerCase().includes(lowerQuery)
  );
}

console.log(`[TokenRegistry] Loaded ${TOKEN_REGISTRY.length} pre-cached tokens`);
