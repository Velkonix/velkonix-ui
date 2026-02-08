import { Trans } from '@lingui/macro';
import { useModalContext } from 'src/hooks/useModal';
import { useRootStore } from 'src/store/root';
import { DashboardReserve } from 'src/utils/dashboardSortUtils';
import { DASHBOARD } from 'src/utils/events';
import { useShallow } from 'zustand/shallow';

import { Link, ROUTES } from '../../../../components/primitives/Link';

export const BorrowAssetsListItem = ({
  name,
  symbol,
  underlyingAsset,
  availableBorrows,
}: DashboardReserve) => {
  const { openBorrow } = useModalContext();
  const [trackEvent, currentMarket] = useRootStore(
    useShallow((store) => [store.trackEvent, store.currentMarket])
  );

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #ddd' }}>
      <div>
        {name} ({symbol})
      </div>
      <div>
        <button
          type="button"
          onClick={() => openBorrow(underlyingAsset, currentMarket, name, 'dashboard')}
        >
          <Trans>Borrow</Trans>
        </button>{' '}
        <Link
          href={ROUTES.reserveOverview(underlyingAsset, currentMarket)}
          onClick={() =>
            trackEvent(DASHBOARD.DETAILS_NAVIGATION, {
              type: 'Button',
              market: currentMarket,
              assetName: name,
              asset: underlyingAsset,
            })
          }
        >
          <Trans>Details</Trans>
        </Link>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>
          <Trans>Available</Trans>: {availableBorrows ?? '0'}
        </div>
      </div>
    </div>
  );
};
