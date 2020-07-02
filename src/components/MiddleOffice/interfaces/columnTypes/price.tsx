import React, { ReactElement } from 'react';
import { priceFormatter } from 'utils/priceFormatter';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { PriceCell } from 'components/MiddleOffice/interfaces/cells/price';
import { Deal } from "components/MiddleOffice/interfaces/deal";

export default (sortable: boolean, width: number = 3): ColumnSpec => ({
  name: 'Price',
  template: '999999.99',
  filterable: true,
  sortable: sortable,
  header: () => 'Level',
  render: (props: CellProps): ReactElement => <PriceCell {...props} />,
  width: width,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const value: number = Number(v1.lastPrice);
    const numeric: number = Number(keyword);
    if (isNaN(numeric)) return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Deal, v2: Deal) => {
    return Number(v1.lastPrice) - Number(v2.lastPrice);
  },
});
