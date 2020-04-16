import React from 'react';
import { Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { involved } from 'columns/messageBlotterColumns/helpers';

export default (sortable: boolean): ColumnSpec => ({
  name: 'Side',
  template: 'SELL',
  filterable: true,
  sortable: sortable,
  header: () => 'Side',
  render: (message: Message) => {
    const { Side } = message;
    if (!involved(message))
      return <div/>;
    return Side === '1' ? 'Buy' : 'Sell';
  },
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: string = v1.Side === '1' ? 'buy' : 'sell';
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return Number(v1) - Number(v2);
  },
});
