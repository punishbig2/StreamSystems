import React, { ReactElement } from 'react';
import { ColumnSpec } from 'components/Table/columnSpecification';
import transactTimeColumn from 'components/MiddleOffice/interfaces/columnTypes/transactionTime';
import { Observer } from 'mobx-react';
import { CellProps } from 'components/MiddleOffice/DealBlotter/props';
import symbolColumn from 'components/MiddleOffice/interfaces/columnTypes/symbol';
import priceColumn from 'components/MiddleOffice/interfaces/columnTypes/price';
import sizeColumn from 'components/MiddleOffice/interfaces/columnTypes/size';
import sellerColumn from 'components/MiddleOffice/interfaces/columnTypes/seller';
import buyerColumn from 'components/MiddleOffice/interfaces/columnTypes/buyer';

export const columns: ColumnSpec[] = [
  {
    name: 'deal-id',
    header: () => 'Deal Id',
    render: (props: CellProps): ReactElement => {
      const { store, deal } = props;
      if (deal) {
        return <div className={'padded'}>{deal.dealID}</div>;
      } else {
        return (
          <Observer
            children={() => (
              <button disabled={!store.isReady} onClick={store.addDeal}>
                <i className={'fa fa-plus'}/> <span>Add</span>
              </button>
            )}
          />
        );
      }
    },
    filterable: true,
    width: 3,
    template: '12345',
  },
  transactTimeColumn(),
  {
    name: 'status',
    header: () => 'Status',
    render: () => '',
    filterable: true,
    width: 3,
    template: '12345',
  },
  symbolColumn(true),
  priceColumn(true),
  sizeColumn(true),
  buyerColumn(true),
  sellerColumn(true),
  {
    name: 'venue',
    header: () => 'Venue',
    render: (props: CellProps): ReactElement | string => {
      return '?';
    },
    filterable: true,
    width: 3,
    template: '12345',
  },
];
