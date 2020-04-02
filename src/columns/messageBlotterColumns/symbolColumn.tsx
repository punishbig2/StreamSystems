import { Message } from 'interfaces/message';
import React from 'react';

const currencyToNumber = (value: string) => {
  return 1000 * value.charCodeAt(0) + value.charCodeAt(3);
};

export default (sortable: boolean) => ({
  name: 'Currency',
  template: 'Symbol',
  filterable: true,
  sortable: sortable,
  header: () => <div>Currency</div>,
  render: ({ Symbol }: Message) => (
    <div className={'message-blotter-cell normal'}>{Symbol}</div>
  ),
  width: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Symbol;
    if (!original) return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    if (!v1.Symbol || !v2.Symbol) return 0;
    return currencyToNumber(v1.Symbol) - currencyToNumber(v2.Symbol);
  },
});
