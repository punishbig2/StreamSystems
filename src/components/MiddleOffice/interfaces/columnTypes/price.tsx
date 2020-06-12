import React, { ReactElement } from 'react';
import { Message } from 'interfaces/message';
import { priceFormatter } from 'utils/priceFormatter';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { PriceCell } from 'components/MiddleOffice/interfaces/cells/price';

export default (sortable: boolean): ColumnSpec => ({
  name: 'Price',
  template: '999999.99',
  filterable: true,
  sortable: sortable,
  header: () => 'Level',
  render: (props: CellProps): ReactElement => <PriceCell {...props} />,
  width: 3,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.Price);
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.Price) - Number(v2.Price);
  },
});
