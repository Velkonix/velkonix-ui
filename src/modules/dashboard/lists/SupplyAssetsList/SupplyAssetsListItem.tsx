import { Trans } from '@lingui/macro';
import { useModalContext } from 'src/hooks/useModal';
import { useRootStore } from 'src/store/root';
import { DashboardReserve } from 'src/utils/dashboardSortUtils';
import { DASHBOARD } from 'src/utils/events';
import { useShallow } from 'zustand/shallow';

import { Link, ROUTES } from '../../../../components/primitives/Link';

export const SupplyAssetsListItem = (params: DashboardReserve) => {
  const { openSupply } = useModalContext();
  const [trackEvent, currentMarket] = useRootStore(
    useShallow((store) => [store.trackEvent, store.currentMarket])
  );

  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #ddd' }}>
      <div>
        {params.name} ({params.symbol})
      </div>
      <div>
        <button
          type="button"
          onClick={() =>
            openSupply(params.underlyingAsset, currentMarket, params.name, 'dashboard')
          }
        >
          <Trans>Supply</Trans>
        </button>{' '}
        <Link
          href={ROUTES.reserveOverview(
            params.detailsAddress || params.underlyingAsset,
            currentMarket
          )}
          onClick={() =>
            trackEvent(DASHBOARD.DETAILS_NAVIGATION, {
              type: 'Button',
              market: currentMarket,
              assetName: params.name,
              asset: params.underlyingAsset,
            })
          }
        >
          <Trans>Details</Trans>
        </Link>
      </div>
    </div>
  );
};
