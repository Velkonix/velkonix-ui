import { AaveClient, chainId, evmAddress, OrderDirection } from '@aave/client';
import { markets } from '@aave/client/actions';
import { useQuery } from '@tanstack/react-query';
import { useTestModeStore } from 'src/mocks/testModeStore';
import { MarketDataType } from 'src/ui-config/marketsConfig';
import { queryKeysFactory } from 'src/ui-config/queries';
import { TEST_MODE } from 'src/utils/testMode';

type UseMarketsDataParams = {
  client: AaveClient;
  marketData: MarketDataType;
  account?: string | null;
};

export const useMarketsData = ({ client, marketData, account }: UseMarketsDataParams) => {
  const userAddress = account ? evmAddress(account) : undefined;
  const marketKey = [
    ...queryKeysFactory.market(marketData),
    ...queryKeysFactory.user(userAddress ?? 'anonymous'),
    TEST_MODE ? mockVersion : 'live',
  ];

  const getFormattedReserves = useTestModeStore((state) => state.getFormattedReserves);
  const getMarketTotals = useTestModeStore((state) => state.getMarketTotals);
  const mockVersion = useTestModeStore((state) => state.version);

  return useQuery({
    queryKey: marketKey,
    enabled: !!client,
    queryFn: async () => {
      if (TEST_MODE) {
        const reserves = getFormattedReserves();
        const totals = getMarketTotals();
        return [
          {
            address: marketData.addresses.LENDING_POOL,
            totalMarketSize: totals.totalMarketSize,
            totalAvailableLiquidity: totals.totalAvailable,
            supplyReserves: reserves.map((reserve) => ({
              underlyingToken: {
                address: reserve.underlyingAsset,
                symbol: reserve.symbol,
                name: reserve.name,
              },
              aToken: { address: reserve.aTokenAddress },
              vToken: { address: reserve.variableDebtTokenAddress },
              size: {
                amount: { value: reserve.totalLiquidity },
                usd: reserve.totalLiquidityUSD,
              },
              supplyInfo: { apy: { value: reserve.supplyAPY } },
              borrowInfo: {
                total: { amount: { value: reserve.totalDebt }, usd: reserve.totalDebtUSD },
                apy: { value: reserve.variableBorrowAPY },
                borrowingState: reserve.borrowingEnabled ? 'ENABLED' : 'DISABLED',
              },
              incentives: [],
              isFrozen: reserve.isFrozen,
              isPaused: reserve.isPaused,
              acceptsNative: reserve.isWrappedBaseAsset,
              isolationModeConfig: { canBeCollateral: reserve.usageAsCollateralEnabled },
            })),
            borrowReserves: reserves.map((reserve) => ({
              underlyingToken: {
                address: reserve.underlyingAsset,
                symbol: reserve.symbol,
                name: reserve.name,
              },
              aToken: { address: reserve.aTokenAddress },
              vToken: { address: reserve.variableDebtTokenAddress },
              size: {
                amount: { value: reserve.totalLiquidity },
                usd: reserve.totalLiquidityUSD,
              },
              supplyInfo: { apy: { value: reserve.supplyAPY } },
              borrowInfo: {
                total: { amount: { value: reserve.totalDebt }, usd: reserve.totalDebtUSD },
                apy: { value: reserve.variableBorrowAPY },
                borrowingState: reserve.borrowingEnabled ? 'ENABLED' : 'DISABLED',
              },
              incentives: [],
              isFrozen: reserve.isFrozen,
              isPaused: reserve.isPaused,
              acceptsNative: reserve.isWrappedBaseAsset,
              isolationModeConfig: { canBeCollateral: reserve.usageAsCollateralEnabled },
            })),
          },
        ];
      }

      const response = await markets(client, {
        chainIds: [chainId(marketData.chainId)],
        user: userAddress,
        suppliesOrderBy: { tokenName: OrderDirection.Asc },
        borrowsOrderBy: { tokenName: OrderDirection.Asc },
      });

      if (response.isErr()) {
        throw response.error;
      }

      return response.value;
    },
  });
};
