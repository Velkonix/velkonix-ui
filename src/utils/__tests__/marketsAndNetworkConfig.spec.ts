import { ChainId } from '@aave/contract-helpers';

import { RotationProvider } from '../rotationProvider';

describe('markets and network config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  it('should use a RotationProvider when there are multiple rpc urls configured for a network', async () => {
    const { getProvider } = await import('../marketsAndNetworksConfig');
    const provider = getProvider(ChainId.mainnet);
    expect(provider).toBeInstanceOf(RotationProvider);
  });

  it('uses a StaticJsonRpcProvider when there is a single rpc url', async () => {
    const { getProvider } = await import('../marketsAndNetworksConfig');
    const provider = getProvider(ChainId.optimism_sepolia);
    expect(provider.constructor.name).toBe('StaticJsonRpcProvider');
  });

  it('uses server proxy provider when private rpc is enabled', async () => {
    process.env.NEXT_PUBLIC_PRIVATE_RPC_ENABLED = 'true';
    const { getProvider } = await import('../marketsAndNetworksConfig');
    const provider = getProvider(ChainId.optimism_sepolia);
    expect(provider.constructor.name).toBe('ServerJsonRpcProvider');
  });

  it('returns unknown network config for unsupported chain', async () => {
    const { getNetworkConfig } = await import('../marketsAndNetworksConfig');
    const config = getNetworkConfig(999999 as ChainId);
    expect(config.name).toContain('unknown chainId: 999999');
  });

  it('builds explorer links for tx and address', async () => {
    const { getNetworkConfig } = await import('../marketsAndNetworksConfig');
    const config = getNetworkConfig(ChainId.mainnet);
    expect(config.explorerLinkBuilder({ tx: '0x123' })).toContain('/tx/0x123');
    expect(config.explorerLinkBuilder({ address: '0xabc' })).toContain('/address/0xabc');
  });
});
