import {Message} from 'interfaces/message';
import React from 'react';

export default {
  name: 'Side',
  template: 'SELL',
  filterable: true,
  sortable: true,
  header: () => <div>Side</div>,
  render: ({Side}: Message) => (
    <div className={'message-blotter-cell normal'}>{Side === '1' ? 'Buy' : 'Sell'}</div>
  ),
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: string = v1.Side === '1' ? 'buy' : 'sell';
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return Number(v1) - Number(v2);
  },
};