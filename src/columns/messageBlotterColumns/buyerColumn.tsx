import React from 'react';
import { ExecTypes, Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { ReactElement } from 'react';

const getBuyer = (message: Message): string | null => {
  if (message.OrdStatus === ExecTypes.Filled || message.OrdStatus === ExecTypes.PartiallyFilled)
    return message.Side === '1' ? message.MDMkt : message.ExecBroker;
  return null;
};

export const buyerColumn = (sortable: boolean): ColumnSpec => ({
  name: 'buyer',
  difference: (m1: any, m2: any) => {
    const s1: string | null = getBuyer(m1);
    const s2: string | null = getBuyer(m2);
    if (s1 === null) return Number.MIN_SAFE_INTEGER;
    if (s2 === null) return Number.MAX_SAFE_INTEGER;
    return s1.localeCompare(s2);
  },
  filterByKeyword: (message: Message, keyword: string) => {
    const buyer: string | null = getBuyer(message);
    if (buyer === null) return false;
    return buyer.includes(keyword);
  },
  header: () => 'Buyer',
  render: (message: Message): ReactElement | string | null => {
    if (message) {
      return getBuyer(message)
    } else {
      return <input/>;
    }
  },
  filterable: true,
  sortable: sortable,
  template: 'BUYER',
  width: 2,
});
