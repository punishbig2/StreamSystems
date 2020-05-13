import { ExecTypes, Message } from 'interfaces/message';
import React from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { involved } from 'columns/messageBlotterColumns/helpers';
import { CellProps } from './cellProps';

export default (sortable: boolean, isExecBlotter: boolean): ColumnSpec => ({
  name: 'CPTY',
  template: 'WWWWWW',
  filterable: true,
  sortable: sortable,
  header: () => 'CPTY',
  render: (props: CellProps) => {
    const { message } = props;
    const { ExecBroker, OrdStatus } = message;
    if (!involved(message))
      return <div/>;
    if (OrdStatus !== ExecTypes.Filled && OrdStatus !== ExecTypes.PartiallyFilled)
      return <div/>;
    return (
      <div className={'normal cpty ' + (isExecBlotter ? 'exec-blotter' : '')}>
        {ExecBroker}
      </div>
    );
  },
  width: 2,
  filterByKeyword: ({ ExecBroker }: Message, keyword: string): boolean => {
    if (ExecBroker) {
      const lowerCase: string = ExecBroker.toLowerCase();
      return lowerCase.includes(keyword.toLowerCase());
    } else {
      return false;
    }
  },
  difference: ({ ExecBroker }: Message, v2: Message) => {
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
