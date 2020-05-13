import React, { ReactElement } from 'react';
import { ExecTypes, Message } from 'interfaces/message';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { BankCell } from './banksCell';
import { CellProps } from './cellProps';
import { Observer } from 'mobx-react';
import { User } from '../../interfaces/user';
import workareaStore from '../../mobx/stores/workareaStore';

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
  render: (props: CellProps): ReactElement | string | null => {
    const { store, message } = props;
    const user: User = workareaStore.user;
    const personality: string = workareaStore.personality;
    if (message) {
      if (message.Username !== user.email && (message.MDMkt === user.firm || message.MDMkt !== personality))
        return null;
      return getBuyer(message);
    } else {
      return <Observer children={() => (
        <BankCell message={message} value={store.buyer} onChange={store.setBuyer} label={'Buyer'}/>
      )}/>;
    }
  },
  filterable: true,
  sortable: sortable,
  template: 'BUYER',
  width: 2,
});
