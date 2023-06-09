import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import React, { ReactElement } from 'react';
import { sizeFormatter } from 'utils/sizeFormatter';

export const SizeCell: React.FC<CellProps> = (props: CellProps): ReactElement => {
  const { deal } = props;
  if (!deal) {
    return <div />;
  } else {
    return <div>{sizeFormatter(deal.notional1 / 1e6)}</div>;
  }
};
