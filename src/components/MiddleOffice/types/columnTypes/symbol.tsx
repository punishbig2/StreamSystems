import { compareCurrencyPairs } from 'columns/messageBlotterColumns/utils';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { SymbolCell } from 'components/MiddleOffice/types/cells/symbol';
import { Deal } from 'components/MiddleOffice/types/deal';
import { TableColumn } from 'components/Table/tableColumn';
import React, { ReactElement } from 'react';

export default (sortable: boolean): TableColumn => ({
  name: 'Currency',
  template: '  XXXXXX  ',
  filterable: true,
  sortable: sortable,
  header: () => 'Currency',
  render: (props: CellProps): ReactElement | null => {
    const { deal } = props;
    if (deal === null) {
      return <SymbolCell deal={deal} />;
    }
    return <span>{deal.currencyPair}</span>;
  },
  width: 3,
  filterByKeyword: (v1: Deal, keyword: string): boolean => {
    const original: string = v1.currencyPair;
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword.toLowerCase());
  },
  difference: (v1: Deal, v2: Deal): number => {
    return compareCurrencyPairs(v1.currencyPair, v2.currencyPair);
  },
});
