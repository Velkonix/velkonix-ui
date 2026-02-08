import { Trans } from '@lingui/macro';
import { useState } from 'react';
import { mapAaveProtocolIncentives } from 'src/components/incentives/incentives.helper';

import { ReserveWithId } from '../../hooks/app-data-provider/useAppDataProvider';
import { MarketAssetsListItem } from './MarketAssetsListItem';

const listHeaders = [
  {
    title: <Trans>Asset</Trans>,
    sortKey: 'underlyingToken.symbol',
  },
  {
    title: <Trans>Total supplied</Trans>,
    sortKey: 'size.usd',
  },
  {
    title: <Trans>Supply APY</Trans>,
    sortKey: 'supplyInfo.apy.value',
  },
  {
    title: <Trans>Total borrowed</Trans>,
    sortKey: 'borrowInfo.total.usd',
  },
  {
    title: <Trans>Borrow APY, variable</Trans>,
    sortKey: 'borrowInfo.apy.value',
  },
];

type MarketAssetsListProps = {
  reserves: ReserveWithId[];
  loading: boolean;
};
export type ReserveWithProtocolIncentives = ReserveWithId & {
  supplyProtocolIncentives: ReturnType<typeof mapAaveProtocolIncentives>;
  borrowProtocolIncentives: ReturnType<typeof mapAaveProtocolIncentives>;
};

export default function MarketAssetsList({ reserves, loading }: MarketAssetsListProps) {
  const [sortName, setSortName] = useState('');
  const [sortDesc, setSortDesc] = useState(false);
  const sortedReserves = [...reserves].sort((a, b) => {
    if (!sortName) return 0;

    let aValue: number | string;
    let bValue: number | string;

    switch (sortName) {
      case 'underlyingToken.symbol':
        aValue = a.underlyingToken.symbol.toUpperCase();
        bValue = b.underlyingToken.symbol.toUpperCase();
        if (sortDesc) {
          return aValue < bValue ? -1 : 1;
        }
        return bValue < aValue ? -1 : 1;

      case 'size.usd':
        aValue = Number(a.size.usd) || 0;
        bValue = Number(b.size.usd) || 0;
        break;

      case 'supplyInfo.apy.value':
        aValue = Number(a.supplyInfo.apy.value) || 0;
        bValue = Number(b.supplyInfo.apy.value) || 0;
        break;

      case 'borrowInfo.total.usd':
        aValue = Number(a.borrowInfo?.total.usd) || 0;
        bValue = Number(b.borrowInfo?.total.usd) || 0;
        break;

      case 'borrowInfo.apy.value':
        aValue = Number(a.borrowInfo?.apy.value) || 0;
        bValue = Number(b.borrowInfo?.apy.value) || 0;
        break;

      default:
        return 0;
    }

    return sortDesc
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });
  const reservesWithIncentives: ReserveWithProtocolIncentives[] = sortedReserves.map((reserve) => ({
    ...reserve,
    supplyProtocolIncentives: mapAaveProtocolIncentives(reserve.incentives, 'supply'),
    borrowProtocolIncentives: mapAaveProtocolIncentives(reserve.incentives, 'borrow'),
  }));

  if (loading) {
    return <div>loading...</div>;
  }

  if (reserves.length === 0) return null;

  const handleSort = (key: string) => {
    if (sortName === key) {
      setSortDesc(!sortDesc);
      return;
    }
    setSortName(key);
    setSortDesc(false);
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {listHeaders.map((col) => (
            <th key={col.sortKey} style={{ textAlign: 'left', padding: '8px' }}>
              <button type="button" onClick={() => handleSort(col.sortKey)}>
                {col.title}
              </button>
            </th>
          ))}
          <th style={{ textAlign: 'left', padding: '8px' }} />
        </tr>
      </thead>
      <tbody>
        {reservesWithIncentives.map((reserve) => (
          <MarketAssetsListItem {...reserve} key={reserve.id} />
        ))}
      </tbody>
    </table>
  );
}
