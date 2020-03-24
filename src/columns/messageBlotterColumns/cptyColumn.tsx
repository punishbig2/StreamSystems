import {ExecTypes, Message} from 'interfaces/message';
import React from 'react';

export default (sortable: boolean, isExecBlotter: boolean) => ({
  name: 'CPTY',
  template: 'WWWWWW',
  filterable: true,
  sortable: sortable,
  header: () => <div>CPTY</div>,
  render: (message: Message) => {
    const {ExecBroker, OrdStatus} = message;
    if (OrdStatus !== ExecTypes.Filled && OrdStatus !== ExecTypes.PartiallyFilled)
      return <div/>;
    return (
      <div className={'message-blotter-cell normal cpty ' + (isExecBlotter ? 'exec-blotter' : '')}>
        {ExecBroker}
      </div>
    );
  },
  weight: 2,
  filterByKeyword: ({ExecBroker}: Message, keyword: string): boolean => {
    if (ExecBroker) {
      const lowerCase: string = ExecBroker.toLowerCase();
      return lowerCase.includes(keyword.toLowerCase());
    } else {
      return false;
    }
  },
  difference: ({ExecBroker}: Message, v2: Message) => {
    if (ExecBroker) {
      const lowerCase: string = ExecBroker.toLowerCase();
      if (v2.ExecBroker) {
        return lowerCase.localeCompare(v2.ExecBroker.toLowerCase());
      } else {
        return -1;
      }
    } else {
      return 1;
    }
  },
});
