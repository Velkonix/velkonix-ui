import { useTestModeStore } from '../testModeStore';

const USDX = '0x86ab95b81b1db338b3d97ab85a0751a4089a960a';
const NATIVE = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const cloneReserves = (reserves: ReturnType<typeof useTestModeStore.getState>['reserves']) =>
  Object.fromEntries(Object.entries(reserves).map(([key, reserve]) => [key, { ...reserve }]));

const cloneUser = (user: ReturnType<typeof useTestModeStore.getState>['user']) => ({
  wallet: { ...user.wallet },
  aTokens: { ...user.aTokens },
  debts: { ...user.debts },
});

const snapshot = () => {
  const state = useTestModeStore.getState();
  return {
    reserves: cloneReserves(state.reserves),
    user: cloneUser(state.user),
    version: state.version,
  };
};

const initialState = snapshot();

describe('test mode store', () => {
  afterEach(() => {
    useTestModeStore.setState({
      reserves: cloneReserves(initialState.reserves),
      user: cloneUser(initialState.user),
      version: initialState.version,
    });
  });

  it('applies supply and withdraw', () => {
    const state = useTestModeStore.getState();
    const beforeWallet = state.user.wallet[USDX];
    const beforeAToken = state.user.aTokens[USDX];
    const beforeReserve = state.reserves[USDX];
    const beforeVersion = state.version;

    state.applySupply(USDX, 1_000_000n);
    let next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet - 1_000_000n);
    expect(next.user.aTokens[USDX]).toBe(beforeAToken + 1_000_000n);
    expect(next.reserves[USDX].totalLiquidity).toBe(beforeReserve.totalLiquidity + 1_000_000n);
    expect(next.reserves[USDX].availableLiquidity).toBe(
      beforeReserve.availableLiquidity + 1_000_000n
    );
    expect(next.version).toBe(beforeVersion + 1);

    next.applyWithdraw(USDX, 500_000n);
    next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet - 500_000n);
    expect(next.user.aTokens[USDX]).toBe(beforeAToken + 500_000n);
    expect(next.reserves[USDX].totalLiquidity).toBe(beforeReserve.totalLiquidity + 500_000n);
    expect(next.reserves[USDX].availableLiquidity).toBe(
      beforeReserve.availableLiquidity + 500_000n
    );
  });

  it('applies borrow and repay', () => {
    const state = useTestModeStore.getState();
    const beforeWallet = state.user.wallet[USDX];
    const beforeDebt = state.user.debts[USDX];
    const beforeReserve = state.reserves[USDX];
    const beforeVersion = state.version;

    state.applyBorrow(USDX, 2_000_000n);
    let next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet + 2_000_000n);
    expect(next.user.debts[USDX]).toBe(beforeDebt + 2_000_000n);
    expect(next.reserves[USDX].totalDebt).toBe(beforeReserve.totalDebt + 2_000_000n);
    expect(next.reserves[USDX].availableLiquidity).toBe(
      beforeReserve.availableLiquidity - 2_000_000n
    );
    expect(next.version).toBe(beforeVersion + 1);

    next.applyRepay(USDX, 1_000_000n);
    next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet + 1_000_000n);
    expect(next.user.debts[USDX]).toBe(beforeDebt + 1_000_000n);
    expect(next.reserves[USDX].totalDebt).toBe(beforeReserve.totalDebt + 1_000_000n);
    expect(next.reserves[USDX].availableLiquidity).toBe(
      beforeReserve.availableLiquidity - 1_000_000n
    );
  });

  it('returns formatted reserves including wrapped base asset flag', () => {
    const reserves = useTestModeStore.getState().getFormattedReserves();
    const weth = reserves.find((reserve) => reserve.symbol === 'WETH');
    expect(weth?.isWrappedBaseAsset).toBe(true);
    expect(weth?.priceInUSD).toBe('2000');
  });

  it('returns wallet balances including native placeholder', () => {
    const balances = useTestModeStore.getState().getWalletBalances();
    expect(balances[USDX]).toBeDefined();
    expect(balances[NATIVE]).toEqual({ amount: '1', amountUSD: '2000' });
  });

  it('formats fractional wallet balances', () => {
    const state = useTestModeStore.getState();
    useTestModeStore.setState({
      user: {
        ...state.user,
        wallet: {
          ...state.user.wallet,
          [USDX]: 1234567n,
        },
      },
    });

    const balances = useTestModeStore.getState().getWalletBalances();
    expect(balances[USDX].amount).toBe('1.234567');
  });

  it('computes market totals', () => {
    const totals = useTestModeStore.getState().getMarketTotals();
    expect(Number(totals.totalMarketSize)).toBeGreaterThan(0);
    expect(Number(totals.totalAvailable)).toBeGreaterThan(0);
    expect(Number(totals.totalBorrows)).toBeGreaterThanOrEqual(0);
  });
});
