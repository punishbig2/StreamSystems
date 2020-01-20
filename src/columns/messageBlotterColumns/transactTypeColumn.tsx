import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';

const TransTypes: { [key: string]: string } = {
  [ExecTypes.New]: 'New',
  [ExecTypes.Canceled]: 'Cancel',
  [ExecTypes.PartiallyFilled]: 'Partially Filled',
  [ExecTypes.Filled]: 'Filled',
  [ExecTypes.Replace]: 'Replace',
  [ExecTypes.PendingCancel]: 'Pending Cancel',
};

export default (filterAndSort: boolean) => ({
  name: 'ExecTransType',
  template: 'Long String to Fit the content',
  header: () => <div>Type</div>,
  filterable: filterAndSort,
  sortable: filterAndSort,
  render: (data: Message) => {
    if (TransTypes[data.OrdStatus]) {
      return (<div className={'message-blotter-cell normal'}>{TransTypes[data.OrdStatus]}</div>);
    } else {
      return (<div className={'message-blotter-cell normal red'}>{data.OrdStatus}</div>);
    }
  },
  weight: 3,
  difference: (v1: Message, v2: Message): number => {
    return Number(v1.OrdStatus) - Number(v2.OrdStatus);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = TransTypes[v1.OrdStatus];
    if (!original)
      return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
});

