import React, { ReactElement } from 'react';

export const NoDataMessage: React.FC = (): ReactElement => {
  return (
    <div className="empty-section">
      <div className="text">There&apos;s no data yet!</div>
    </div>
  );
};
