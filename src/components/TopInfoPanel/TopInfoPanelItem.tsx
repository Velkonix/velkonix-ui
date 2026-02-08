import { ReactNode } from 'react';

interface TopInfoPanelItemProps {
  icon?: ReactNode;
  title: ReactNode;
  titleIcon?: ReactNode;
  children: ReactNode;
  hideIcon?: boolean;
  withoutIconWrapper?: boolean;
  variant?: 'light' | 'dark' | undefined;
  withLine?: boolean;
  loading?: boolean;
}

export const TopInfoPanelItem = ({ title, children, loading }: TopInfoPanelItemProps) => {
  return (
    <div style={{ minWidth: '160px' }}>
      <div style={{ fontSize: '12px', opacity: 0.7 }}>{title}</div>
      <div>{loading ? '...' : children}</div>
    </div>
  );
};
