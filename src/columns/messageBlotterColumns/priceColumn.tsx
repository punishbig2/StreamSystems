import { Message } from 'interfaces/message';
import React from 'react';
import { priceFormatter } from 'utils/priceFormatter';
import { getMessagePrice } from 'messageUtils';

export default (sortable: boolean) => ({
  name: 'Price',
  template: '999999.99',
  filterable: true,
  sortable: sortable,
  header: () => <div>Level</div>,
  render: (message: Message) => {
    return (
      <div className={'message-blotter-cell normal'}>
        {priceFormatter(getMessagePrice(message))}
      </div>
    );

  },
  width: 2,
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
