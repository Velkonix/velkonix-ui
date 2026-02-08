import { ReactNode } from 'react';

export interface PageTitleProps {
  pageTitle?: ReactNode;
  withMarketSwitcher?: boolean;
  withMigrateButton?: boolean;
  withFavoriteButton?: boolean;
  bridge?: unknown;
}

export const PageTitle = ({ pageTitle }: PageTitleProps) => {
  if (!pageTitle) return null;

  return (
    <div style={{ marginBottom: '12px' }}>
      <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>{pageTitle}</h1>
    </div>
  );
};
