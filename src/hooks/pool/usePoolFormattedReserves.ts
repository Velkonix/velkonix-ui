import {
  EmodeDataHumanized,
  ReserveDataHumanized,
  ReservesDataHumanized,
  ReservesIncentiveDataHumanized,
} from '@aave/contract-helpers';
import { formatReservesAndIncentives } from '@aave/math-utils';
import dayjs from 'dayjs';
import memoize from 'micro-memoize';
import { useTestModeStore } from 'src/mocks/testModeStore';
import { reserveSortFn } from 'src/store/poolSelectors';
import { MarketDataType } from 'src/ui-config/marketsConfig';
import { fetchIconSymbolAndName, IconMapInterface } from 'src/ui-config/reservePatches';
import { getNetworkConfig, NetworkConfig } from 'src/utils/marketsAndNetworksConfig';
import { TEST_MODE } from 'src/utils/testMode';

import { selectBaseCurrencyData, selectReserves } from './selectors';
import { usePoolsEModes } from './usePoolEModes';
import { usePoolsReservesHumanized } from './usePoolReserves';
import { usePoolsReservesIncentivesHumanized } from './usePoolReservesIncentives';
import { SimplifiedUseQueryResult } from './utils';

export type FormattedReservesAndIncentives = ReturnType<
  typeof formatReservesAndIncentives
>[number] &
  IconMapInterface & {
    isWrappedBaseAsset: boolean;
  } & ReserveDataHumanized;

const formatReserves = memoize(
  (
    reservesData: ReservesDataHumanized,
    incentivesData: ReservesIncentiveDataHumanized[],
    poolsEModesData: EmodeDataHumanized[],
    networkConfig: NetworkConfig
  ) => {
    const reserves = selectReserves(reservesData);
    const baseCurrencyData = selectBaseCurrencyData(reservesData);
    return formatReservesAndIncentives({
      reserves,
      currentTimestamp: dayjs().unix(),
      marketReferenceCurrencyDecimals: baseCurrencyData.marketReferenceCurrencyDecimals,
      marketReferencePriceInUsd: baseCurrencyData.marketReferenceCurrencyPriceInUsd,
      reserveIncentives: incentivesData,
      eModes: poolsEModesData,
    })
      .map((r) => ({
        ...r,
        ...fetchIconSymbolAndName(r),
        isWrappedBaseAsset:
          r.symbol.toLowerCase() === networkConfig.wrappedBaseAssetSymbol?.toLowerCase(),
      }))
      .sort(reserveSortFn);
  }
);

export const usePoolsFormattedReserves = (
  marketsData: MarketDataType[]
): SimplifiedUseQueryResult<FormattedReservesAndIncentives[]>[] => {
  const poolsReservesQueries = usePoolsReservesHumanized(marketsData);
  const poolsReservesIncentivesQueries = usePoolsReservesIncentivesHumanized(marketsData);
  const poolsEModesQueries = usePoolsEModes(marketsData);
  const mockVersion = useTestModeStore((state) => state.version);
  const getFormattedReserves = useTestModeStore((state) => state.getFormattedReserves);

  return poolsReservesQueries.map((poolReservesQuery, index) => {
    if (TEST_MODE) {
      mockVersion;
      return {
        isPending: false,
        data: getFormattedReserves() as FormattedReservesAndIncentives[],
        error: null,
      };
    }

    const marketData = marketsData[index];
    const poolReservesIncentivesQuery = poolsReservesIncentivesQueries[index];
    const poolEModesQuery = poolsEModesQueries[index];
    const networkConfig = getNetworkConfig(marketData.chainId);

    const isPending =
      poolReservesQuery.isPending ||
      poolReservesIncentivesQuery.isPending ||
      poolEModesQuery.isPending;

    const reservesData = poolReservesQuery.data;
    const incentivesData = poolReservesIncentivesQuery.data ?? [];
    const poolsEModesData = poolEModesQuery.data ?? [];

    const error = poolReservesQuery.error ?? null;

    if (!reservesData) {
      return {
        isPending,
        data: undefined,
        error,
      };
    }

    return {
      isPending: false,
      data: formatReserves(reservesData, incentivesData, poolsEModesData, networkConfig),
      error: null,
    };
  });
};

export const usePoolFormattedReserves = (marketData: MarketDataType) => {
  return usePoolsFormattedReserves([marketData])[0];
};
