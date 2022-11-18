import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { SizeCell } from 'components/MiddleOffice/types/cells/size';
import { Deal } from 'components/MiddleOffice/types/deal';
import { TableColumn } from 'components/Table/tableColumn';
import React, { ReactElement } from 'react';

export default (sortable: boolean, width = 3): TableColumn => ({
  name: 'Size',
  template: '999999',
  filterable: true,
  sortable: sortable,
  header: () => 'Size',
  render: (props: CellProps): ReactElement => <SizeCell {...props} />,
  width: width,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const value: number = v1.notional1;
    const numeric = Number(keyword);
    if (isNaN(numeric)) return false;
    return value === numeric;
  },
  difference: (v1: Deal, v2: Deal) => {
    return Number(v1.notional1) - Number(v2.notional1);
  },
});
