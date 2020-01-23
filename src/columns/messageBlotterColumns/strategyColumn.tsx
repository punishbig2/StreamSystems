import {Message} from 'interfaces/message';
import React from 'react';

export default (sortable: boolean) => ({
  name: 'Strategy',
  template: 'WWWWWW',
  filterable: true,
  sortable: sortable,
  header: () => <div>Strategy</div>,
  render: ({Strategy}: Message) => (
    <div className={'message-blotter-cell normal'}>{Strategy}</div>
  ),
  weight: 2,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Strategy;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message) => {
    const s1: string = v1.Strategy;
    return s1.localeCompare(v2.Strategy);
  },
});
