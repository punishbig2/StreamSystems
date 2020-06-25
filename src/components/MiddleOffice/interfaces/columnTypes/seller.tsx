import React, { ReactElement } from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { BankCell } from '../cells/banks';
import { Observer } from 'mobx-react';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import { Deal } from 'components/MiddleOffice/interfaces/deal';

export default (sortable: boolean): ColumnSpec => ({
  name: 'seller',
  difference: (m1: Deal, m2: Deal) => {
    const s1: string | null = m1.seller;
    const s2: string | null = m2.seller;
    if (s1 === null) return Number.MIN_SAFE_INTEGER;
    if (s2 === null) return Number.MAX_SAFE_INTEGER;
    return s1.localeCompare(s2);
  },
  filterByKeyword: (deal: Deal, keyword: string) => {
    const seller: string | null = deal.seller;
    if (seller === null) return false;
    return seller.includes(keyword);
  },
  header: () => 'Seller',
  render: (props: CellProps): ReactElement | string | null => {
    const { store, deal } = props;
    if (deal === null) {
      return (
        <Observer
          children={() => (
            <BankCell
              deal={deal}
              value={store.seller}
              onChange={store.setSeller}
              label={'Seller'}
            />
          )}
        />
      );
    } else {
      return <span>{deal.seller}</span>;
    }
  },
  filterable: true,
  sortable: sortable,
  template: 'BUYER',
  width: 2,
});
