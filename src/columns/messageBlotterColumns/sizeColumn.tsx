import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';

const getValue = (message: Message): number => {
  switch (message.OrdStatus) {
    case ExecTypes.PartiallyFilled:
    case ExecTypes.Filled:
      return Number(message.LastShares);
    case ExecTypes.Canceled:
      return Number(message.LeavesQty);
    default:
      return Number(message.OrderQty);
  }
};

export default {
  name: 'Size',
  template: '999999',
  filterable: true,
  sortable: true,
  header: () => <div>Size</div>,
  render: (message: Message) => <div className={'message-blotter-cell normal'}>{getValue(message)}</div>,
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = getValue(v1);
    const numeric: number = Number(keyword);
    if (isNaN(numeric))
      return false;
    return value === numeric;
  },
  difference: (v1: Message, v2: Message) => {
    return getValue(v1) - getValue(v2);
  },
};
