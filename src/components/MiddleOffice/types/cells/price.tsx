import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import React, { ReactElement } from 'react';
import { priceFormatter } from 'utils/priceFormatter';

export const PriceCell: React.FC<CellProps> = (props: CellProps): ReactElement => {
  const { deal } = props;
  if (deal) {
    return <div>{priceFormatter(deal.dealPrice)}</div>;
  } else {
    return <div />;
  }
};
