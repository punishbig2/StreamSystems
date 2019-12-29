import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';

export default {
  name: 'Size',
  template: '999999',
  filterable: true,
  sortable: true,
  header: () => <div>Size</div>,
  render: (message: Message) => {
    switch (message.OrdStatus) {
      case ExecTypes.PartiallyFilled:
      case ExecTypes.Filled:
        return <div className={'message-blotter-cell normal'}>{message.LastShares}</div>;
      case ExecTypes.Canceled:
        return <div className={'message-blotter-cell normal'}>{message.LeavesQty}</div>;
      default:
        return <div className={'message-blotter-cell normal'}>{message.OrderQty}</div>;
    }
  },
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.OrderQty);
    const numeric: number = Number(keyword);
    if (isNaN(numeric))
      return false;
    return value === numeric;
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.OrderQty) - Number(v2.OrderQty);
  },
};
