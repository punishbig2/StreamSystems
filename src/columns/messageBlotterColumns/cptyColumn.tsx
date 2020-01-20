import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';

export default (filterAndSort: boolean) => ({
  name: 'CPTY',
  template: 'WWWWWW',
  filterable: filterAndSort,
  sortable: filterAndSort,
  header: () => <div>CPTY</div>,
  render: (message: Message) => {
    const {ExecBroker, OrdStatus} = message;
    if ((OrdStatus !== ExecTypes.Filled) && (OrdStatus !== ExecTypes.PartiallyFilled))
      return <div/>;
    return (
      <div className={'message-blotter-cell normal'}>{ExecBroker}</div>
    );
  },
  weight: 2,
  filterByKeyword: ({ExecBroker}: Message, keyword: string): boolean => {
    return ExecBroker.includes(keyword);
  },
  difference: ({ExecBroker}: Message, v2: Message) => {
    return ExecBroker.localeCompare(v2.MDMkt);
  },
});
