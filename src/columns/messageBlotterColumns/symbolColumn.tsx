import React, { ReactElement } from 'react';
import { Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { SymbolCell } from './symbolCell';
import { compareCurrencies } from './utils';

export default (sortable: boolean): ColumnSpec => ({
  name: 'Currency',
  template: '  XXXXXX  ',
  filterable: true,
  sortable: sortable,
  header: () => 'Currency',
  render: (message: Message): ReactElement => <SymbolCell message={message}/>,
  width: 3,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Symbol;
    if (!original)
      return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return compareCurrencies(v1.Symbol, v2.Symbol);

  },
});
