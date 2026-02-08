import * as React from 'react';
import { ConnectWalletButton } from 'src/components/WalletConnection/ConnectWalletButton';

import { Link, ROUTES } from '../components/primitives/Link';
import { uiConfig } from '../uiConfig';
import { SettingsMenu } from './SettingsMenu';

export function AppHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        padding: '8px 12px',
        borderBottom: '1px solid #ccc',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" aria-label="Go to homepage" style={{ display: 'inline-flex' }}>
          <img src={uiConfig.appLogo} alt="Logo" width={72} height={20} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={ROUTES.dashboard}>Dashboard</Link>
          <Link href={ROUTES.markets}>Markets</Link>
          <Link href={ROUTES.staking}>Staking</Link>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ConnectWalletButton />
        <SettingsMenu />
      </div>
    </header>
  );
}
