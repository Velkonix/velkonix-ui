import { API_ETH_MOCK_ADDRESS } from '@aave/contract-helpers';
import { USD_DECIMALS, valueToBigNumber } from '@aave/math-utils';
import { Trans } from '@lingui/macro';
import { useState } from 'react';
import { useRootStore } from 'src/store/root';
import { fetchIconSymbolAndName } from 'src/ui-config/reservePatches';
import { displayGhoForMintableMarket } from 'src/utils/ghoUtilities';
import { useShallow } from 'zustand/shallow';

import {
  ComputedReserveData,
  useAppDataContext,
} from '../../../../hooks/app-data-provider/useAppDataProvider';
import {
  DashboardReserve,
  handleSortDashboardReserves,
} from '../../../../utils/dashboardSortUtils';
import {
  assetCanBeBorrowedByUser,
  getMaxAmountAvailableToBorrow,
} from '../../../../utils/getMaxAmountAvailableToBorrow';
import { isAssetHidden } from '../constants';

const head = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'symbol',
  },
  {
    title: <Trans>Available</Trans>,
    sortKey: 'availableBorrows',
  },
  {
    title: <Trans>APY, variable</Trans>,
    sortKey: 'variableBorrowAPY',
  },
];

export const BorrowAssetsList = () => {
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);

  const [currentNetworkConfig, currentMarketData] = useRootStore(
    useShallow((store) => [store.currentNetworkConfig, store.currentMarketData])
  );
  const currentMarket = currentMarketData.market;
  const { user, reserves, marketReferencePriceInUsd, loading } = useAppDataContext();

  const { baseAssetSymbol } = currentNetworkConfig;

  const tokensToBorrow = reserves
    .filter((reserve) => (user ? assetCanBeBorrowedByUser(reserve, user) : false))
    .filter((reserve) => !isAssetHidden(currentMarketData.market, reserve.underlyingAsset))
    .map((reserve: ComputedReserveData) => {
      const availableBorrows = user ? Number(getMaxAmountAvailableToBorrow(reserve, user)) : 0;

      const availableBorrowsInUSD = valueToBigNumber(availableBorrows)
        .multipliedBy(reserve.formattedPriceInMarketReferenceCurrency)
        .multipliedBy(marketReferencePriceInUsd)
        .shiftedBy(-USD_DECIMALS)
        .toFixed(2);

      return {
        ...reserve,
        reserve,
        totalBorrows: reserve.totalDebt,
        availableBorrows,
        availableBorrowsInUSD,
        variableBorrowRate: reserve.borrowingEnabled ? Number(reserve.variableBorrowAPY) : -1,
        iconSymbol: reserve.iconSymbol,
        ...(reserve.isWrappedBaseAsset
          ? fetchIconSymbolAndName({
              symbol: baseAssetSymbol,
              underlyingAsset: API_ETH_MOCK_ADDRESS.toLowerCase(),
            })
          : {}),
      };
    });

  const borrowReserves = tokensToBorrow.filter(
    ({ availableBorrowsInUSD, totalLiquidityUSD, symbol }) => {
      if (displayGhoForMintableMarket({ symbol, currentMarket })) {
        return true;
      }

      return availableBorrowsInUSD !== '0.00' && totalLiquidityUSD !== '0';
    }
  );

  const sortedReserves = handleSortDashboardReserves(
    sortDesc,
    sortName,
    'asset',
    borrowReserves as DashboardReserve[]
  );

  if (loading) return <div>loading...</div>;
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
        <Trans>Assets to borrow</Trans>
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
              <td style={{ padding: '8px' }}>{item.availableBorrows ?? '0'}</td>
              <td style={{ padding: '8px' }}>{item.variableBorrowRate ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};
