import { ReactNode } from 'react';

import { PageTitle, PageTitleProps } from './PageTitle';

interface TopInfoPanelProps extends PageTitleProps {
  children?: ReactNode;
  titleComponent?: ReactNode;
  containerProps?: unknown;
}

export const TopInfoPanel = ({ pageTitle, titleComponent, children }: TopInfoPanelProps) => {
  return (
    <section style={{ padding: '16px 12px', borderBottom: '1px solid #ccc' }}>
      {!titleComponent && <PageTitle pageTitle={pageTitle} />}
      {titleComponent && titleComponent}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>{children}</div>
    </section>
  );
};
