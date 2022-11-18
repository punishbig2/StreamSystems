import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import React, { ReactElement } from 'react';

export const BankCell: React.FC<CellProps> = (props: CellProps): ReactElement | null => {
  const { deal } = props;
  if (deal) {
    return null;
  } else {
    return <div />;
  }
};
