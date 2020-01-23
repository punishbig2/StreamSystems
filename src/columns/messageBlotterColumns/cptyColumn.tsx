import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';

export default (sortable: boolean) => ({
  name: 'CPTY',
  template: 'WWWWWW',
  filterable: true,
  sortable: sortable,
  header: () => <div>CPTY</div>,
  render: (message: Message) => {
    const {ExecBroker, OrdStatus} = message;
    if (
      OrdStatus !== ExecTypes.Filled &&
      OrdStatus !== ExecTypes.PartiallyFilled
    )
      return <div/>;
    return <div className={'message-blotter-cell normal'}>{ExecBroker}</div>;
  },
  weight: 2,
  filterByKeyword: ({ExecBroker}: Message, keyword: string): boolean => {
    return ExecBroker.includes(keyword);
  },
  difference: ({ExecBroker}: Message, v2: Message) => {
    return ExecBroker.localeCompare(v2.MDMkt);
  },
});
