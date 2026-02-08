import { ReservesDataHumanized } from '@aave/contract-helpers';
import { useQueries, UseQueryOptions } from '@tanstack/react-query';
import { useTestModeStore } from 'src/mocks/testModeStore';
import { MarketDataType } from 'src/ui-config/marketsConfig';
import { POLLING_INTERVAL, queryKeysFactory } from 'src/ui-config/queries';
import { useSharedDependencies } from 'src/ui-config/SharedDependenciesProvider';
import { TEST_MODE } from 'src/utils/testMode';

import { HookOpts } from '../commonTypes';

export const usePoolsReservesHumanized = <T = ReservesDataHumanized>(
  marketsData: MarketDataType[],
  opts?: HookOpts<ReservesDataHumanized, T>
) => {
  const { uiPoolService } = useSharedDependencies();
  const getFormattedReserves = useTestModeStore((state) => state.getFormattedReserves);

  const liveQueries = useQueries({
    queries: marketsData.map(
      (marketData) =>
        ({
          queryKey: queryKeysFactory.poolReservesDataHumanized(marketData),
          queryFn: () => uiPoolService.getReservesHumanized(marketData),
          refetchInterval: POLLING_INTERVAL,
          meta: {},
          ...opts,
        } as UseQueryOptions<ReservesDataHumanized, Error, T>)
    ),
  });

  if (TEST_MODE) {
    return marketsData.map(() => {
      const reserves = getFormattedReserves();
      const reservesData = reserves.map((reserve) => ({
        id: reserve.id,
        symbol: reserve.symbol,
        name: reserve.name,
        decimals: reserve.decimals,
        underlyingAsset: reserve.underlyingAsset,
        usageAsCollateralEnabled: reserve.usageAsCollateralEnabled,
        reserveFactor: reserve.reserveFactor,
        baseLTVasCollateral: reserve.baseLTVasCollateral,
        liquidityIndex: '1',
        reserveLiquidationThreshold: reserve.reserveLiquidationThreshold,
        reserveLiquidationBonus: reserve.reserveLiquidationBonus,
        variableBorrowIndex: '1',
        variableBorrowRate: reserve.variableBorrowAPY,
        availableLiquidity: reserve.availableLiquidity,
        liquidityRate: reserve.supplyAPY,
        totalScaledVariableDebt: '0',
        lastUpdateTimestamp: Math.floor(Date.now() / 1000),
        borrowCap: reserve.borrowCap,
        supplyCap: reserve.supplyCap,
        debtCeiling: reserve.debtCeiling,
        debtCeilingDecimals: reserve.debtCeilingDecimals,
        isolationModeTotalDebt: reserve.isolationModeTotalDebt,
        virtualUnderlyingBalance: reserve.totalLiquidity,
        deficit: '0',
        priceInMarketReferenceCurrency: reserve.priceInMarketReferenceCurrency,
      }));
      return {
        isPending: false,
        data: {
          reservesData,
          baseCurrencyData: {
            marketReferenceCurrencyDecimals: 8,
            marketReferenceCurrencyPriceInUsd: '1',
            networkBaseTokenPriceInUsd: '2000',
            networkBaseTokenPriceDecimals: 8,
          },
        } as unknown as ReservesDataHumanized,
        error: null,
      };
    });
  }

  return liveQueries;
};

export const usePoolReservesHumanized = (marketData: MarketDataType) => {
  return usePoolsReservesHumanized([marketData])[0];
};
