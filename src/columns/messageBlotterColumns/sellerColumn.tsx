import React from 'react';
import { ExecTypes, Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { ReactElement } from 'react';

const getSeller = (message: Message): string | null => {
  if (message.OrdStatus === ExecTypes.Filled || message.OrdStatus === ExecTypes.PartiallyFilled)
    return message.Side === '1' ? message.ExecBroker : message.MDMkt;
  return null;
};

export const sellerColumn = (sortable: boolean): ColumnSpec => ({
  name: 'seller',
  difference: (m1: Message, m2: Message) => {
    const s1: string | null = getSeller(m1);
    const s2: string | null = getSeller(m2);
    if (s1 === null) return Number.MIN_SAFE_INTEGER;
    if (s2 === null) return Number.MAX_SAFE_INTEGER;
    return s1.localeCompare(s2);
  },
  filterByKeyword: (message: Message, keyword: string) => {
    const seller: string | null = getSeller(message);
    if (seller === null) return false;
    return seller.includes(keyword);
  },
  header: () => 'Seller',
  render: (message: Message): ReactElement | string | null => {
    if (message) {
      return getSeller(message);
    } else {
      return <input/>;
    }
  },
  filterable: true,
  sortable: sortable,
  template: 'SELLER',
  width: 2,
});
