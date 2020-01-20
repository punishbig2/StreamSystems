import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';
import {priceFormatter} from 'utils/priceFormatter';

export default (filterAndSort: boolean) => ({
  name: 'Price',
  template: '999999.99',
  filterable: filterAndSort,
  sortable: filterAndSort,
  header: () => <div>Level</div>,
  render: ({OrdStatus, LastPx, Price}: Message) => {
    if (OrdStatus === ExecTypes.PartiallyFilled || OrdStatus === ExecTypes.Filled) {
      return (
        <div className={'message-blotter-cell normal'}>{priceFormatter(Number(LastPx))}</div>
      );
    } else {
      return (
        <div className={'message-blotter-cell normal'}>{priceFormatter(Number(Price))}</div>
      );
    }
  },
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.Price);
    const numeric: number = Number(keyword);
    if (isNaN(numeric))
      return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.Price) - Number(v2.Price);
  },
});
