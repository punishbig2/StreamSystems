import {Message} from 'interfaces/message';
import React from 'react';
import {currencyToNumber} from 'redux/actions/workareaActions';

export default {
  name: 'Symbol',
  template: 'Symbol',
  filterable: true,
  sortable: true,
  header: () => <div>Currency</div>,
  render: ({Symbol}: Message) => (
    <div className={'message-blotter-cell normal'}>{Symbol}</div>
  ),
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Symbol;
    if (!original)
      return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    if (!v1.Symbol || !v2.Symbol)
      return 0;
    return currencyToNumber(v1.Symbol) - currencyToNumber(v2.Symbol);
  },
};
