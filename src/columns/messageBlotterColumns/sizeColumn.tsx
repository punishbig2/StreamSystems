import React from 'react';
import { Message } from 'interfaces/message';
import { getMessageSize } from 'messageUtils';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { ReactElement } from 'react';

export default (sortable: boolean): ColumnSpec => ({
  name: 'Size',
  template: '999999',
  filterable: true,
  sortable: sortable,
  header: () => 'Size',
  render: (message: Message): ReactElement | string => {
    if (!message) {
      return <input/>;
    } else {
      const size: number = getMessageSize(message);
      return size.toString();
    }
  },
  width: 3,
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
