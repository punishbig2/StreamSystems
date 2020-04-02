import { OrderTypes } from 'interfaces/mdEntry';
import { ExecTypes, Message } from 'interfaces/message';
import React from 'react';

const getSeller = (message: Message): string | null => {
  if (
    message.OrdStatus === ExecTypes.Filled ||
    message.OrdStatus === ExecTypes.PartiallyFilled
  )
    return message.Side === OrderTypes.Bid ? message.MDMkt : message.ExecBroker;
  return null;
};

export const sellerColumn = (sortable: boolean) => ({
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
  header: () => {
    return <div>Seller</div>;
  },
  render: (message: Message) => {
    return <div className={'message-blotter-cell'}>{getSeller(message)}</div>;
  },
  filterable: true,
  sortable: sortable,
  template: 'SELLER',
  width: 2,
});
