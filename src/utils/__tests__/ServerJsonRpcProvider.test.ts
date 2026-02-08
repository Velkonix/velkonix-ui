import { ServerJsonRpcProvider } from '../ServerJsonRpcProvider';

describe('ServerJsonRpcProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns result when proxy responds', async () => {
    const provider = new ServerJsonRpcProvider(123);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: 'ok' }),
    } as Response);

    const result = await provider.send('eth_chainId', []);

    expect(result).toBe('ok');
    expect(global.fetch).toHaveBeenCalledWith('/api/rpc-proxy/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainId: 123, method: 'eth_chainId', params: [] }),
    });
  });

  it('throws when proxy responds with error payload', async () => {
    const provider = new ServerJsonRpcProvider(1);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: { message: 'rpc error' } }),
    } as Response);

    await expect(provider.send('eth_chainId', [])).rejects.toThrow('rpc error');
  });

  it('throws when proxy returns non-ok json error', async () => {
    const provider = new ServerJsonRpcProvider(1);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'boom' }),
    } as Response);

    await expect(provider.send('eth_chainId', [])).rejects.toThrow('boom');
  });

  it('throws when proxy returns non-ok plain text', async () => {
    const provider = new ServerJsonRpcProvider(1);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'bad gateway',
    } as Response);

    await expect(provider.send('eth_chainId', [])).rejects.toThrow(
      'Failed with status 502: bad gateway'
    );
  });

  it('returns a cached network without rpc calls', async () => {
    const provider = new ServerJsonRpcProvider(5);
    const network = await provider.detectNetwork();

    expect(network.chainId).toBe(5);
  });
});
