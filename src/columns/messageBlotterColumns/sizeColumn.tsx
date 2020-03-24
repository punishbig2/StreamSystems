import {Message} from 'interfaces/message';
import React from 'react';
import {getMessageSize} from 'messageUtils';

export default (sortable: boolean) => ({
  name: 'Size',
  template: '999999',
  filterable: true,
  sortable: sortable,
  header: () => <div>Size</div>,
  render: (message: Message) => (
    <div className={'message-blotter-cell normal'}>{getMessageSize(message)}</div>
  ),
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = getMessageSize(v1);
    const numeric: number = Number(keyword);
    if (isNaN(numeric))
      return false;
    return value === numeric;
  },
  difference: (v1: Message, v2: Message) => {
    return getMessageSize(v1) - getMessageSize(v2);
  },
});
