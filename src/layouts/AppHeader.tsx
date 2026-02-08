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
        padding: '12px 20px',
        borderBottom: '1px solid var(--vx-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" aria-label="Go to homepage" style={{ display: 'inline-flex' }}>
          <img src={uiConfig.appLogo} alt="Logo" width={72} height={20} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={ROUTES.dashboard} style={{ color: 'var(--vx-text)' }}>
            Dashboard
          </Link>
          <Link href={ROUTES.markets} style={{ color: 'var(--vx-text)' }}>
            Markets
          </Link>
          <Link href={ROUTES.staking} style={{ color: 'var(--vx-text)' }}>
            Staking
          </Link>
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ConnectWalletButton />
        <SettingsMenu />
      </div>
    </header>
  );
}
