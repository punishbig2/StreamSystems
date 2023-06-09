import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { PriceCell } from 'components/MiddleOffice/types/cells/price';
import { Deal } from 'components/MiddleOffice/types/deal';
import { TableColumn } from 'components/Table/tableColumn';
import React, { ReactElement } from 'react';
import { priceFormatter } from 'utils/priceFormatter';

export default (sortable: boolean, width = 3): TableColumn => ({
  name: 'Price',
  template: '999999.99',
  filterable: true,
  sortable: sortable,
  header: () => 'Level',
  render: (props: CellProps): ReactElement => <PriceCell {...props} />,
  width: width,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    // FIXME: should use the right one
    const value: number | null = v1.dealPrice;
    if (value === null) return false;
    const numeric = Number(keyword);
    if (isNaN(numeric)) return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Deal, v2: Deal) => {
    const p1: number | null = v1.dealPrice;
    const p2: number | null = v2.dealPrice;
    if (p1 === null) return -1;
    if (p2 === null) return 1;
    return p1 - p2;
  },
});
