import React, { ReactElement } from 'react';
import { ExecTypes, Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { BankCell } from './banksCell';
import { CellProps } from './cellProps';
import { Observer } from 'mobx-react';
import workareaStore from '../../mobx/stores/workareaStore';
import { User } from '../../interfaces/user';

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
    if (s1 === null)
      return Number.MIN_SAFE_INTEGER;
    if (s2 === null)
      return Number.MAX_SAFE_INTEGER;
    return s1.localeCompare(s2);
  },
  filterByKeyword: (message: Message, keyword: string) => {
    const seller: string | null = getSeller(message);
    if (seller === null) return false;
    return seller.includes(keyword);
  },
  header: () => 'Seller',
  render: (props: CellProps): ReactElement | string | null => {
    const { store, message } = props;
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    if (message) {
      if (message.Username !== user.email && (message.MDMkt === user.firm || message.MDMkt !== personality))
        return null;
      return getSeller(message);
    } else {
      return (
        <Observer children={() => (
          <BankCell message={message} value={store.seller} onChange={store.setSeller} label={'Seller'}/>
        )}/>
      );
    }
  },
  filterable: true,
  sortable: sortable,
  template: 'SELLER',
  width: 2,
});
