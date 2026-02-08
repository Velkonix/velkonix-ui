import type { EmodeMarketCategory, Market, MarketUserState, Reserve } from '@aave/graphql';
import { UserReserveData } from '@aave/math-utils';
import { client } from 'pages/_app.page';
import React, { PropsWithChildren, useContext } from 'react';
import { EmodeCategory } from 'src/helpers/types';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';
import { TEST_MODE } from 'src/utils/testMode';

import { formatEmodes } from '../../store/poolSelectors';
import {
  ExtendedFormattedUser as _ExtendedFormattedUser,
  useExtendedUserSummaryAndIncentives,
} from '../pool/useExtendedUserSummaryAndIncentives';
import {
  FormattedReservesAndIncentives,
  usePoolFormattedReserves,
} from '../pool/usePoolFormattedReserves';
import { usePoolReservesHumanized } from '../pool/usePoolReserves';
import { useUserPoolReservesHumanized } from '../pool/useUserPoolReserves';
import { FormattedUserReserves } from '../pool/useUserSummaryAndIncentives';
import { useMarketsData } from './useMarketsData';

/**
 * removes the marketPrefix from a symbol
 * @param symbol
 * @param prefix
 */
export const unPrefixSymbol = (symbol: string, prefix: string) => {
  return symbol.toUpperCase().replace(RegExp(`^(${prefix[0]}?${prefix.slice(1)})`), '');
};

/**
 * @deprecated Use FormattedReservesAndIncentives type from usePoolFormattedReserves hook
 */
export type ComputedReserveData = FormattedReservesAndIncentives;

/**
 * @deprecated Use FormattedUserReserves type from useUserSummaryAndIncentives hook
 */
export type ComputedUserReserveData = FormattedUserReserves;

/**
 * @deprecated Use ExtendedFormattedUser type from useExtendedUserSummaryAndIncentives hook
 */
export type ExtendedFormattedUser = _ExtendedFormattedUser;
export type ReserveWithId = Reserve & { id: string };
export interface AppDataContextType {
  loading: boolean;
  /** SDK market snapshot */
  market?: Market;
  totalBorrows?: number;
  supplyReserves: ReserveWithId[];
  borrowReserves: ReserveWithId[];
  eModeCategories: EmodeMarketCategory[];
  userState?: MarketUserState;
  /** Legacy fields (deprecated) kept temporarily for incremental migration */
  reserves: ComputedReserveData[];
  eModes: Record<number, EmodeCategory>;
  user?: ExtendedFormattedUser;
  marketReferencePriceInUsd: string;
  marketReferenceCurrencyDecimals: number;
  userReserves: UserReserveData[];
}

const AppDataContext = React.createContext<AppDataContextType>({} as AppDataContextType);

/**
 * This is the only provider you'll ever need.
 * It fetches reserves /incentives & walletbalances & keeps them updated.
 */
export const AppDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { currentAccount } = useWeb3Context();

  const currentMarketData = useRootStore((state) => state.currentMarketData);

  const { data, isPending } = useMarketsData({
    client,
    marketData: currentMarketData,
    account: currentAccount,
  });

  const marketAddress = currentMarketData.addresses.LENDING_POOL.toLowerCase();

  const sdkMarket = data?.find((item) => item.address.toLowerCase() === marketAddress);

  const totalBorrowsFromSdk = sdkMarket?.borrowReserves.reduce((acc, reserve) => {
    const value = reserve.borrowInfo?.total?.usd ?? 0;
    return acc + Number(value);
  }, 0);

  const formattedReserves = formattedPoolReserves || [];

  const fallbackReserves = formattedReserves.map((reserve) => ({
    id: `${marketAddress}-${reserve.underlyingAsset}`,
    underlyingToken: {
      address: reserve.underlyingAsset,
      symbol: reserve.symbol,
      name: reserve.name,
    },
    aToken: {
      address: reserve.aTokenAddress,
    },
    vToken: {
      address: reserve.variableDebtTokenAddress,
    },
    size: {
      amount: { value: reserve.totalLiquidity },
      usd: reserve.totalLiquidityUSD,
    },
    supplyInfo: {
      apy: { value: reserve.supplyAPY },
    },
    borrowInfo: {
      total: {
        amount: { value: reserve.totalDebt },
        usd: reserve.totalDebtUSD,
      },
      apy: { value: reserve.variableBorrowAPY },
      borrowingState: reserve.borrowingEnabled ? 'ENABLED' : 'DISABLED',
    },
    incentives: [],
    isFrozen: reserve.isFrozen,
    isPaused: reserve.isPaused,
    acceptsNative: reserve.isWrappedBaseAsset,
    isolationModeConfig: {
      canBeCollateral: reserve.usageAsCollateralEnabled,
    },
  }));

  const totalBorrowsFromFallback = formattedReserves.reduce(
    (acc, reserve) => acc + Number(reserve.totalDebtUSD || 0),
    0
  );

  const totalMarketSizeFromFallback = formattedReserves.reduce(
    (acc, reserve) => acc + Number(reserve.totalLiquidityUSD || 0),
    0
  );

  const totalAvailableLiquidityFromFallback = formattedReserves.reduce(
    (acc, reserve) => acc + Number(reserve.availableLiquidityUSD || 0),
    0
  );

  const shouldUseFallbackReserves =
    !sdkMarket ||
    (sdkMarket.supplyReserves?.length ?? 0) === 0 ||
    (sdkMarket.borrowReserves?.length ?? 0) === 0;

  const totalBorrows = !Number.isFinite(totalBorrowsFromSdk)
    ? totalBorrowsFromFallback
    : sdkMarket
    ? totalBorrowsFromSdk
    : totalBorrowsFromFallback;

  const supplyReserves = (
    shouldUseFallbackReserves ? fallbackReserves : sdkMarket?.supplyReserves ?? fallbackReserves
  ).map((reserve) => ({
    ...reserve,
    id: `${sdkMarket?.address ?? marketAddress}-${reserve.underlyingToken.address}`,
  }));

  const borrowReserves = (
    shouldUseFallbackReserves ? fallbackReserves : sdkMarket?.borrowReserves ?? fallbackReserves
  ).map((reserve) => ({
    ...reserve,
    id: `${sdkMarket?.address ?? marketAddress}-${reserve.underlyingToken.address}`,
  }));

  const eModeCategories = sdkMarket?.eModeCategories ?? [];
  const marketUserState = sdkMarket?.userState ?? undefined;

  const { data: reservesData, isPending: reservesDataLoading } =
    usePoolReservesHumanized(currentMarketData);
  const { data: formattedPoolReserves, isPending: formattedPoolReservesLoading } =
    usePoolFormattedReserves(currentMarketData);
  const baseCurrencyData = reservesData?.baseCurrencyData;
  // user hooks

  const eModes = formattedPoolReserves ? formatEmodes(formattedPoolReserves) : {};

  const { data: userReservesData, isPending: userReservesDataLoading } =
    useUserPoolReservesHumanized(currentMarketData);
  const { data: userSummary, isPending: userSummaryLoading } =
    useExtendedUserSummaryAndIncentives(currentMarketData);
  const userReserves = userReservesData?.userReserves;

  // loading
  const isReservesLoading = reservesDataLoading || formattedPoolReservesLoading;
  const isUserDataLoading = userReservesDataLoading || userSummaryLoading;

  const loading = isPending || isReservesLoading || (!!currentAccount && isUserDataLoading);

  return (
    <AppDataContext.Provider
      value={{
        loading,
        market:
          sdkMarket &&
          Number.isFinite(Number(sdkMarket.totalMarketSize)) &&
          Number.isFinite(Number(sdkMarket.totalAvailableLiquidity))
            ? sdkMarket
            : formattedReserves.length
            ? ({
                totalMarketSize: String(totalMarketSizeFromFallback),
                totalAvailableLiquidity: String(totalAvailableLiquidityFromFallback),
              } as Market)
            : undefined,
        totalBorrows,
        supplyReserves,
        borrowReserves,
        eModeCategories,
        userState: marketUserState,
        // Legacy fields (to be removed once consumers migrate)
        reserves: formattedPoolReserves || [],
        eModes,
        user: userSummary,
        userReserves: userReserves || [],
        marketReferencePriceInUsd: TEST_MODE
          ? '1'
          : baseCurrencyData?.marketReferenceCurrencyPriceInUsd || '0',
        marketReferenceCurrencyDecimals: TEST_MODE
          ? 8
          : baseCurrencyData?.marketReferenceCurrencyDecimals || 0,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppDataContext = () => useContext(AppDataContext);
