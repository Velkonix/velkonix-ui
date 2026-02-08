import { useTestModeStore } from '../testModeStore';

const USDX = '0x86ab95b81b1db338b3d97ab85a0751a4089a960a';

describe('test mode store', () => {
  it('applies supply and withdraw', () => {
    const state = useTestModeStore.getState();
    const beforeWallet = state.user.wallet[USDX];
    const beforeAToken = state.user.aTokens[USDX];

    state.applySupply(USDX, 1_000_000n);
    let next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet - 1_000_000n);
    expect(next.user.aTokens[USDX]).toBe(beforeAToken + 1_000_000n);

    next.applyWithdraw(USDX, 500_000n);
    next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet - 500_000n);
    expect(next.user.aTokens[USDX]).toBe(beforeAToken + 500_000n);
  });

  it('applies borrow and repay', () => {
    const state = useTestModeStore.getState();
    const beforeWallet = state.user.wallet[USDX];
    const beforeDebt = state.user.debts[USDX];

    state.applyBorrow(USDX, 2_000_000n);
    let next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet + 2_000_000n);
    expect(next.user.debts[USDX]).toBe(beforeDebt + 2_000_000n);

    next.applyRepay(USDX, 1_000_000n);
    next = useTestModeStore.getState();
    expect(next.user.wallet[USDX]).toBe(beforeWallet + 1_000_000n);
    expect(next.user.debts[USDX]).toBe(beforeDebt + 1_000_000n);
  });

  it('computes market totals', () => {
    const totals = useTestModeStore.getState().getMarketTotals();
    expect(Number(totals.totalMarketSize)).toBeGreaterThan(0);
    expect(Number(totals.totalAvailable)).toBeGreaterThan(0);
  });
});
