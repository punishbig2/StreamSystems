import {Message} from 'interfaces/message';
import React from 'react';
import {User} from 'interfaces/user';
import {getAuthenticatedUser} from 'utils/getCurrentUser';

export default (sortable: boolean, isExecBlotter: boolean) => ({
  name: 'Side',
  template: 'SELL',
  filterable: true,
  sortable: sortable,
  header: () => <div>Side</div>,
  render: ({Side, Username}: Message) => {
    const user: User = getAuthenticatedUser();
    if (isExecBlotter && Username !== user.email)
      return null;
    return (
      <div className={'message-blotter-cell normal'}>
        {Side === '1' ? 'Buy' : 'Sell'}
      </div>
    );
  },
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: string = v1.Side === '1' ? 'buy' : 'sell';
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return Number(v1) - Number(v2);
  },
});
