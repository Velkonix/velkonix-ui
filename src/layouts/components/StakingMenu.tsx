import { Trans } from '@lingui/macro';
import { Button, Typography } from '@mui/material';
import React from 'react';
import { useRootStore } from 'src/store/root';
import { NAV_BAR } from 'src/utils/events';

import { Link, ROUTES } from '../../components/primitives/Link';

interface StakingMenuProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function StakingMenu({ isMobile = false, onClose }: StakingMenuProps) {
  const trackEvent = useRootStore((store) => store.trackEvent);

  const handleClick = () => {
    trackEvent(NAV_BAR.MAIN_MENU, { nav_link: 'Staking' });
    if (onClose) onClose();
  };

  if (isMobile) {
    return (
      <Typography
        component={Link}
        href={ROUTES.staking}
        variant="h2"
        color="#F1F1F3"
        sx={{ width: '100%', p: 4 }}
        onClick={handleClick}
      >
        <Trans>Staking</Trans>
      </Typography>
    );
  }

  return (
    <Button
      component={Link}
      href={ROUTES.staking}
      onClick={handleClick}
      sx={{ color: '#F1F1F3', p: '6px 8px' }}
    >
      <Trans>Staking</Trans>
    </Button>
  );
}
