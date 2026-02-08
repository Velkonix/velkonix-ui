import { Trans } from '@lingui/macro';
import { useRouter } from 'next/router';
import { useRootStore } from 'src/store/root';
import { fetchIconSymbolAndName } from 'src/ui-config/reservePatches';
import { MARKETS } from 'src/utils/events';
import { useShallow } from 'zustand/shallow';

import { FormattedNumber } from '../../components/primitives/FormattedNumber';
import { Link, ROUTES } from '../../components/primitives/Link';
import { ReserveWithProtocolIncentives } from './MarketAssetsList';

export const MarketAssetsListItem = ({ ...reserve }: ReserveWithProtocolIncentives) => {
  const router = useRouter();
  const [trackEvent, currentMarket] = useRootStore(
    useShallow((store) => [store.trackEvent, store.currentMarket])
  );
  const { iconSymbol, name } = fetchIconSymbolAndName({
    underlyingAsset: reserve.underlyingToken.address,
    symbol: reserve.underlyingToken.symbol,
    name: reserve.underlyingToken.name,
  });

  const displayName = name || reserve.underlyingToken.name;
  const displaySymbol = iconSymbol || reserve.underlyingToken.symbol;

  return (
    <tr
      onClick={() => {
        trackEvent(MARKETS.DETAILS_NAVIGATION, {
          type: 'Row',
          assetName: reserve.underlyingToken.name,
          asset: reserve.underlyingToken.address.toLowerCase(),
          market: currentMarket,
        });
        router.push(
          ROUTES.reserveOverview(reserve.underlyingToken.address.toLowerCase(), currentMarket)
        );
      }}
      style={{ cursor: 'pointer' }}
      data-cy={`marketListItem_${reserve.underlyingToken.symbol.toUpperCase()}`}
    >
      <td style={{ padding: '8px' }}>
        {displayName} ({displaySymbol})
      </td>
      <td style={{ padding: '8px' }}>
        <FormattedNumber value={reserve.size.amount.value} />
      </td>
      <td style={{ padding: '8px' }}>
        {reserve.supplyInfo.apy.value ? `${reserve.supplyInfo.apy.value}%` : '-'}
      </td>
      <td style={{ padding: '8px' }}>
        {reserve.borrowInfo && Number(reserve.borrowInfo.total.amount.value) > 0 ? (
          <FormattedNumber value={Number(reserve.borrowInfo?.total.amount.value)} />
        ) : (
          '-'
        )}
      </td>
      <td style={{ padding: '8px' }}>
        {Number(reserve.borrowInfo?.total.amount.value) > 0
          ? `${reserve.borrowInfo?.apy.value}%`
          : '-'}
      </td>
      <td style={{ padding: '8px' }}>
        <Link
          href={ROUTES.reserveOverview(
            reserve.underlyingToken.address.toLowerCase(),
            currentMarket
          )}
          onClick={(event) => {
            event.stopPropagation();
            trackEvent(MARKETS.DETAILS_NAVIGATION, {
              type: 'Button',
              assetName: reserve.underlyingToken.name,
              asset: reserve.underlyingToken.address.toLowerCase(),
              market: currentMarket,
            });
          }}
        >
          <Trans>Details</Trans>
        </Link>
      </td>
    </tr>
  );
};
