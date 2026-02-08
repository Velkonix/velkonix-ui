import { create } from 'zustand';

export const MOCK_ACCOUNT = '0x1111111111111111111111111111111111111111';

export type ReserveState = {
  symbol: string;
  name: string;
  underlyingAsset: string;
  decimals: number;
  aTokenAddress: string;
  vTokenAddress: string;
  totalLiquidity: bigint;
  availableLiquidity: bigint;
  totalDebt: bigint;
  supplyAPY: string;
  variableBorrowAPY: string;
  priceUsd: number;
  isWrappedBaseAsset?: boolean;
};

export type TestUserState = {
  wallet: Record<string, bigint>;
  aTokens: Record<string, bigint>;
  debts: Record<string, bigint>;
};

export type FormattedReserve = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  underlyingAsset: string;
  aTokenAddress: string;
  variableDebtTokenAddress: string;
  totalLiquidity: string;
  availableLiquidity: string;
  totalDebt: string;
  totalVariableDebt: string;
  totalLiquidityUSD: string;
  availableLiquidityUSD: string;
  totalDebtUSD: string;
  totalVariableDebtUSD: string;
  priceInMarketReferenceCurrency: string;
  formattedPriceInMarketReferenceCurrency: string;
  priceInUSD: string;
  supplyAPY: string;
  supplyAPR: string;
  variableBorrowAPY: string;
  variableBorrowAPR: string;
  baseLTVasCollateral: string;
  reserveLiquidationThreshold: string;
  reserveLiquidationBonus: string;
  reserveFactor: string;
  usageAsCollateralEnabled: boolean;
  borrowingEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  isPaused: boolean;
  supplyCap: string;
  borrowCap: string;
  debtCeiling: string;
  debtCeilingDecimals: number;
  isolationModeTotalDebt: string;
  isIsolated: boolean;
  eModes: [];
  isWrappedBaseAsset: boolean;
};

export type TestModeState = {
  reserves: Record<string, ReserveState>;
  user: TestUserState;
  version: number;
  applySupply: (asset: string, amount: bigint) => void;
  applyWithdraw: (asset: string, amount: bigint) => void;
  applyBorrow: (asset: string, amount: bigint) => void;
  applyRepay: (asset: string, amount: bigint) => void;
  getFormattedReserves: () => FormattedReserve[];
  getWalletBalances: () => Record<string, { amount: string; amountUSD: string }>;
  getMarketTotals: () => { totalMarketSize: string; totalAvailable: string; totalBorrows: string };
};

const toHuman = (amount: bigint, decimals: number) => {
  const scale = 10n ** BigInt(decimals);
  const whole = amount / scale;
  const frac = amount % scale;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
};

const toUsd = (amount: bigint, decimals: number, priceUsd: number) => {
  const human = Number(toHuman(amount, decimals));
  return String(human * priceUsd);
};

const makeReserve = (
  partial: Omit<ReserveState, 'totalLiquidity' | 'availableLiquidity' | 'totalDebt'> & {
    totalLiquidity: string;
    availableLiquidity: string;
    totalDebt: string;
  }
) => {
  return {
    ...partial,
    totalLiquidity: BigInt(partial.totalLiquidity),
    availableLiquidity: BigInt(partial.availableLiquidity),
    totalDebt: BigInt(partial.totalDebt),
  } as ReserveState;
};

const USDX = '0x86Ab95b81b1Db338b3d97aB85A0751a4089A960A'.toLowerCase();
const WBTC = '0x23D022Ad0e159490Fdb72b73aF7B5EDE7d6D2eE6'.toLowerCase();
const WETH = '0x60616486c576EEe50d0Dbb2cf48a327ad00F82F4'.toLowerCase();

const initialReserves: Record<string, ReserveState> = {
  [USDX]: makeReserve({
    symbol: 'USDX',
    name: 'USDX',
    underlyingAsset: USDX,
    decimals: 6,
    aTokenAddress: '0xf76f5775b139c1b0a54c3751c35fef9904d6e9b4',
    vTokenAddress: '0x0000000000000000000000000000000000000001',
    totalLiquidity: '1000000000',
    availableLiquidity: '1000000000',
    totalDebt: '0',
    supplyAPY: '0.02',
    variableBorrowAPY: '0.05',
    priceUsd: 1,
  }),
  [WBTC]: makeReserve({
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    underlyingAsset: WBTC,
    decimals: 8,
    aTokenAddress: '0x0000000000000000000000000000000000000002',
    vTokenAddress: '0x0000000000000000000000000000000000000003',
    totalLiquidity: '100000000',
    availableLiquidity: '100000000',
    totalDebt: '0',
    supplyAPY: '0.01',
    variableBorrowAPY: '0.06',
    priceUsd: 40000,
  }),
  [WETH]: makeReserve({
    symbol: 'WETH',
    name: 'Wrapped Ether',
    underlyingAsset: WETH,
    decimals: 18,
    aTokenAddress: '0x0000000000000000000000000000000000000004',
    vTokenAddress: '0x0000000000000000000000000000000000000005',
    totalLiquidity: '10000000000000000000',
    availableLiquidity: '10000000000000000000',
    totalDebt: '0',
    supplyAPY: '0.015',
    variableBorrowAPY: '0.04',
    priceUsd: 2000,
    isWrappedBaseAsset: true,
  }),
};

const initialUser: TestUserState = {
  wallet: {
    [USDX]: 5000000000n,
    [WBTC]: 200000000n,
    [WETH]: 5000000000000000000n,
  },
  aTokens: {
    [USDX]: 0n,
    [WBTC]: 0n,
    [WETH]: 0n,
  },
  debts: {
    [USDX]: 0n,
    [WBTC]: 0n,
    [WETH]: 0n,
  },
};

export const useTestModeStore = create<TestModeState>((set, get) => ({
  reserves: initialReserves,
  user: initialUser,
  version: 0,
  applySupply: (asset, amount) =>
    set((state) => {
      const reserve = state.reserves[asset];
      if (!reserve) return state;
      return {
        ...state,
        version: state.version + 1,
        reserves: {
          ...state.reserves,
          [asset]: {
            ...reserve,
            totalLiquidity: reserve.totalLiquidity + amount,
            availableLiquidity: reserve.availableLiquidity + amount,
          },
        },
        user: {
          ...state.user,
          wallet: {
            ...state.user.wallet,
            [asset]: (state.user.wallet[asset] ?? 0n) - amount,
          },
          aTokens: {
            ...state.user.aTokens,
            [asset]: (state.user.aTokens[asset] ?? 0n) + amount,
          },
        },
      };
    }),
  applyWithdraw: (asset, amount) =>
    set((state) => {
      const reserve = state.reserves[asset];
      if (!reserve) return state;
      return {
        ...state,
        version: state.version + 1,
        reserves: {
          ...state.reserves,
          [asset]: {
            ...reserve,
            totalLiquidity: reserve.totalLiquidity - amount,
            availableLiquidity: reserve.availableLiquidity - amount,
          },
        },
        user: {
          ...state.user,
          wallet: {
            ...state.user.wallet,
            [asset]: (state.user.wallet[asset] ?? 0n) + amount,
          },
          aTokens: {
            ...state.user.aTokens,
            [asset]: (state.user.aTokens[asset] ?? 0n) - amount,
          },
        },
      };
    }),
  applyBorrow: (asset, amount) =>
    set((state) => ({
      ...state,
      version: state.version + 1,
      reserves: {
        ...state.reserves,
        [asset]: {
          ...state.reserves[asset],
          totalDebt: state.reserves[asset].totalDebt + amount,
          availableLiquidity: state.reserves[asset].availableLiquidity - amount,
        },
      },
      user: {
        ...state.user,
        wallet: {
          ...state.user.wallet,
          [asset]: (state.user.wallet[asset] ?? 0n) + amount,
        },
        debts: {
          ...state.user.debts,
          [asset]: (state.user.debts[asset] ?? 0n) + amount,
        },
      },
    })),
  applyRepay: (asset, amount) =>
    set((state) => ({
      ...state,
      version: state.version + 1,
      reserves: {
        ...state.reserves,
        [asset]: {
          ...state.reserves[asset],
          totalDebt: state.reserves[asset].totalDebt - amount,
          availableLiquidity: state.reserves[asset].availableLiquidity + amount,
        },
      },
      user: {
        ...state.user,
        wallet: {
          ...state.user.wallet,
          [asset]: (state.user.wallet[asset] ?? 0n) - amount,
        },
        debts: {
          ...state.user.debts,
          [asset]: (state.user.debts[asset] ?? 0n) - amount,
        },
      },
    })),
  getFormattedReserves: () => {
    const reserves = get().reserves;
    return Object.values(reserves).map((reserve) => {
      const totalLiquidity = toHuman(reserve.totalLiquidity, reserve.decimals);
      const availableLiquidity = toHuman(reserve.availableLiquidity, reserve.decimals);
      const totalDebt = toHuman(reserve.totalDebt, reserve.decimals);
      const priceInMarketReferenceCurrency = String(reserve.priceUsd);
      return {
        id: reserve.underlyingAsset,
        symbol: reserve.symbol,
        name: reserve.name,
        decimals: reserve.decimals,
        underlyingAsset: reserve.underlyingAsset,
        aTokenAddress: reserve.aTokenAddress,
        variableDebtTokenAddress: reserve.vTokenAddress,
        totalLiquidity,
        availableLiquidity,
        totalDebt,
        totalVariableDebt: totalDebt,
        totalLiquidityUSD: toUsd(reserve.totalLiquidity, reserve.decimals, reserve.priceUsd),
        availableLiquidityUSD: toUsd(
          reserve.availableLiquidity,
          reserve.decimals,
          reserve.priceUsd
        ),
        totalDebtUSD: toUsd(reserve.totalDebt, reserve.decimals, reserve.priceUsd),
        totalVariableDebtUSD: toUsd(reserve.totalDebt, reserve.decimals, reserve.priceUsd),
        priceInMarketReferenceCurrency,
        formattedPriceInMarketReferenceCurrency: priceInMarketReferenceCurrency,
        priceInUSD: String(reserve.priceUsd),
        supplyAPY: reserve.supplyAPY,
        supplyAPR: reserve.supplyAPY,
        variableBorrowAPY: reserve.variableBorrowAPY,
        variableBorrowAPR: reserve.variableBorrowAPY,
        baseLTVasCollateral: '0.5',
        reserveLiquidationThreshold: '0.65',
        reserveLiquidationBonus: '1.05',
        reserveFactor: '0.1',
        usageAsCollateralEnabled: true,
        borrowingEnabled: true,
        isActive: true,
        isFrozen: false,
        isPaused: false,
        supplyCap: '0',
        borrowCap: '0',
        debtCeiling: '0',
        debtCeilingDecimals: 2,
        isolationModeTotalDebt: '0',
        isIsolated: false,
        eModes: [],
        isWrappedBaseAsset: reserve.isWrappedBaseAsset ?? false,
      };
    });
  },
  getWalletBalances: () => {
    const reserves = get().reserves;
    const wallet = get().user.wallet;
    const balances: Record<string, { amount: string; amountUSD: string }> = {};
    Object.values(reserves).forEach((reserve) => {
      const raw = wallet[reserve.underlyingAsset] ?? 0n;
      balances[reserve.underlyingAsset] = {
        amount: toHuman(raw, reserve.decimals),
        amountUSD: toUsd(raw, reserve.decimals, reserve.priceUsd),
      };
    });
    balances['0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'] = {
      amount: '1',
      amountUSD: '2000',
    };
    return balances;
  },
  getMarketTotals: () => {
    const reserves = Object.values(get().reserves);
    const totalMarketSize = reserves.reduce(
      (acc, reserve) =>
        acc + Number(toUsd(reserve.totalLiquidity, reserve.decimals, reserve.priceUsd)),
      0
    );
    const totalAvailable = reserves.reduce(
      (acc, reserve) =>
        acc + Number(toUsd(reserve.availableLiquidity, reserve.decimals, reserve.priceUsd)),
      0
    );
    const totalBorrows = reserves.reduce(
      (acc, reserve) => acc + Number(toUsd(reserve.totalDebt, reserve.decimals, reserve.priceUsd)),
      0
    );
    return {
      totalMarketSize: String(totalMarketSize),
      totalAvailable: String(totalAvailable),
      totalBorrows: String(totalBorrows),
    };
  },
}));
