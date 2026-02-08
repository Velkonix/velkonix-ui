import { Trans } from '@lingui/macro';
import * as React from 'react';

import { FormattedNumber } from '../../components/primitives/FormattedNumber';
import { TopInfoPanel } from '../../components/TopInfoPanel/TopInfoPanel';
import { TopInfoPanelItem } from '../../components/TopInfoPanel/TopInfoPanelItem';
import { useAppDataContext } from '../../hooks/app-data-provider/useAppDataProvider';

export const MarketsTopPanel = () => {
  const { market, totalBorrows, loading } = useAppDataContext();

  return (
    <TopInfoPanel pageTitle={<Trans>Markets</Trans>}>
      <TopInfoPanelItem title={<Trans>Total market size</Trans>} loading={loading}>
        <FormattedNumber value={Number(market?.totalMarketSize)} symbol="USD" visibleDecimals={2} />
      </TopInfoPanelItem>
      <TopInfoPanelItem title={<Trans>Total available</Trans>} loading={loading}>
        <FormattedNumber
          value={Number(market?.totalAvailableLiquidity)}
          symbol="USD"
          visibleDecimals={2}
        />
      </TopInfoPanelItem>
      <TopInfoPanelItem title={<Trans>Total borrows</Trans>} loading={loading}>
        <FormattedNumber value={Number(totalBorrows)} symbol="USD" visibleDecimals={2} />
      </TopInfoPanelItem>
    </TopInfoPanel>
  );
};
