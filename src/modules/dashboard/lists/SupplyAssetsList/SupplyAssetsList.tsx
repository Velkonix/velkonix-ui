import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { BigNumber } from 'bignumber.js';
import { useState } from 'react';
import { useRootStore } from 'src/store/root';
import { fetchIconSymbolAndName } from 'src/ui-config/reservePatches';
import { displayGhoForMintableMarket } from 'src/utils/ghoUtilities';

import {
  ComputedReserveData,
  useAppDataContext,
} from '../../../../hooks/app-data-provider/useAppDataProvider';
import { useWalletBalances } from '../../../../hooks/app-data-provider/useWalletBalances';
import {
  DashboardReserve,
  handleSortDashboardReserves,
} from '../../../../utils/dashboardSortUtils';
import { isAssetHidden } from '../constants';

const head = [
  { title: <Trans>Assets</Trans>, sortKey: 'symbol' },
  { title: <Trans>Wallet balance</Trans>, sortKey: 'walletBalance' },
  { title: <Trans>APY</Trans>, sortKey: 'supplyAPY' },
  { title: <Trans>Can be collateral</Trans>, sortKey: 'usageAsCollateralEnabledOnUser' },
];

export const SupplyAssetsList = () => {
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const currentMarketData = useRootStore((store) => store.currentMarketData);
  const currentMarket = useRootStore((store) => store.currentMarket);
  const {
    user,
    reserves,
    marketReferencePriceInUsd,
    loading: loadingReserves,
  } = useAppDataContext();
  const { walletBalances, loading } = useWalletBalances(currentMarketData);

  const tokensToSupply = reserves
    .filter(
      (reserve: ComputedReserveData) =>
        !(reserve.isFrozen || reserve.isPaused) &&
        !displayGhoForMintableMarket({ symbol: reserve.symbol, currentMarket }) &&
        !isAssetHidden(currentMarketData.market, reserve.underlyingAsset)
    )
    .map((reserve: ComputedReserveData) => {
      const walletBalance = walletBalances[reserve.underlyingAsset]?.amount;
      const walletBalanceUSD = walletBalances[reserve.underlyingAsset]?.amountUSD;
      let availableToDeposit = valueToBigNumber(walletBalance);
      if (reserve.supplyCap !== '0') {
        availableToDeposit = BigNumber.min(
          availableToDeposit,
          new BigNumber(reserve.supplyCap).minus(reserve.totalLiquidity).multipliedBy('0.995')
        );
      }
      const availableToDepositUSD = valueToBigNumber(availableToDeposit)
        .multipliedBy(reserve.priceInMarketReferenceCurrency)
        .multipliedBy(marketReferencePriceInUsd)
        .shiftedBy(-USD_DECIMALS)
        .toString();

      const isIsolated = reserve.isIsolated;
      const hasDifferentCollateral = user?.userReservesData.find(
        (userRes) => userRes.usageAsCollateralEnabledOnUser && userRes.reserve.id !== reserve.id
      );

      const userEMode = reserve.eModes?.find((e) => e.id === user?.userEmodeCategoryId);
      const hasLiquidationThreshold =
        reserve.reserveLiquidationThreshold !== '0' ||
        (user?.isInEmode && userEMode?.collateralEnabled);

      const usageAsCollateralEnabledOnUser = !user?.isInIsolationMode
        ? hasLiquidationThreshold && (!isIsolated || (isIsolated && !hasDifferentCollateral))
        : !isIsolated
        ? false
        : !hasDifferentCollateral;

      if (reserve.isWrappedBaseAsset) {
        let baseAvailableToDeposit = valueToBigNumber(
          walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount
        );
        if (reserve.supplyCap !== '0') {
          baseAvailableToDeposit = BigNumber.min(
            baseAvailableToDeposit,
            new BigNumber(reserve.supplyCap).minus(reserve.totalLiquidity).multipliedBy('0.995')
          );
        }
        const baseAvailableToDepositUSD = valueToBigNumber(baseAvailableToDeposit)
          .multipliedBy(reserve.priceInMarketReferenceCurrency)
          .multipliedBy(marketReferencePriceInUsd)
          .shiftedBy(-USD_DECIMALS)
          .toString();
        return [
          {
            ...reserve,
            reserve,
            underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
            ...fetchIconSymbolAndName({
              symbol: reserve.symbol,
              underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
            }),
            walletBalance: walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amount,
            walletBalanceUSD: walletBalances[API_ETH_MOCK_ADDRESS.toLowerCase()]?.amountUSD,
            availableToDeposit: baseAvailableToDeposit.toString(),
            availableToDepositUSD: baseAvailableToDepositUSD,
            usageAsCollateralEnabledOnUser,
            detailsAddress: reserve.underlyingAsset,
            id: reserve.id + 'base',
          },
          {
            ...reserve,
            reserve,
            walletBalance,
            walletBalanceUSD,
            availableToDeposit:
              availableToDeposit.toNumber() <= 0 ? '0' : availableToDeposit.toString(),
            availableToDepositUSD:
              Number(availableToDepositUSD) <= 0 ? '0' : availableToDepositUSD.toString(),
            usageAsCollateralEnabledOnUser,
            detailsAddress: reserve.underlyingAsset,
          },
        ];
      }

      return {
        ...reserve,
        reserve,
        walletBalance,
        walletBalanceUSD,
        availableToDeposit:
          availableToDeposit.toNumber() <= 0 ? '0' : availableToDeposit.toString(),
        availableToDepositUSD:
          Number(availableToDepositUSD) <= 0 ? '0' : availableToDepositUSD.toString(),
        usageAsCollateralEnabledOnUser,
        detailsAddress: reserve.underlyingAsset,
      };
    })
    .flat();

  const preSortedReserves = tokensToSupply as DashboardReserve[];
  const sortedReserves = handleSortDashboardReserves(
    sortDesc,
    sortName,
    'assets',
    preSortedReserves
  );

  if (loadingReserves || loading) return <div>loading...</div>;
  if (!sortedReserves.length) return null;

  const handleSort = (key: string) => {
    if (sortName === key) {
      setSortDesc(!sortDesc);
      return;
    }
    setSortName(key);
    setSortDesc(false);
  };

  return (
    <section>
      <h2>
        <Trans>Assets to supply</Trans>
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {head.map((col) => (
              <th key={col.sortKey} style={{ textAlign: 'left', padding: '8px' }}>
                <button type="button" onClick={() => handleSort(col.sortKey)}>
                  {col.title}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedReserves.map((item) => (
            <tr key={item.id || item.underlyingAsset}>
              <td style={{ padding: '8px' }}>{item.symbol}</td>
              <td style={{ padding: '8px' }}>{item.walletBalance ?? '0'}</td>
              <td style={{ padding: '8px' }}>{item.supplyAPY ?? '-'}</td>
              <td style={{ padding: '8px' }}>
                {item.usageAsCollateralEnabledOnUser ? 'yes' : 'no'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
