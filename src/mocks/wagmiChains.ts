const makeChain = (id: number, name: string) => ({
  id,
  name,
  network: name.toLowerCase().replace(/\s+/g, '-'),
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://localhost'] } },
  blockExplorers: { default: { name: 'explorer', url: 'http://localhost' } },
});

export const arbitrum = makeChain(42161, 'Arbitrum');
export const arbitrumSepolia = makeChain(421614, 'Arbitrum Sepolia');
export const avalanche = makeChain(43114, 'Avalanche');
export const avalancheFuji = makeChain(43113, 'Avalanche Fuji');
export const base = makeChain(8453, 'Base');
export const baseSepolia = makeChain(84532, 'Base Sepolia');
export const bsc = makeChain(56, 'BNB');
export const celo = makeChain(42220, 'Celo');
export const gnosis = makeChain(100, 'Gnosis');
export const ink = makeChain(9999, 'Ink');
export const linea = makeChain(59144, 'Linea');
export const mainnet = makeChain(1, 'Ethereum');
export const mantle = makeChain(5000, 'Mantle');
export const megaeth = makeChain(4242, 'MegaETH');
export const metis = makeChain(1088, 'Metis');
export const optimism = makeChain(10, 'Optimism');
export const optimismSepolia = makeChain(11155420, 'Optimism Sepolia');
export const plasma = makeChain(8888, 'Plasma');
export const polygon = makeChain(137, 'Polygon');
export const scroll = makeChain(534352, 'Scroll');
export const scrollSepolia = makeChain(534351, 'Scroll Sepolia');
export const sepolia = makeChain(11155111, 'Sepolia');
export const soneium = makeChain(7777777, 'Soneium');
export const sonic = makeChain(146, 'Sonic');
export const zksync = makeChain(324, 'ZkSync');

export type Chain = ReturnType<typeof makeChain>;
