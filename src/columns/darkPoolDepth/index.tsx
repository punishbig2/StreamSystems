import React from 'react';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';

const columns: ColumnSpec[] = [{
  name: 'bid-firm',
  header: () => null,
  render: ({bid}: any) => (<span className={getOrderStatusClass(bid.status, 'dp-table-cell')}>{bid.firm}</span>),
  weight: 2,
  template: 'FIRM',
}, {
  name: 'bid-size',
  header: () => null,
  render: ({bid}: any) => (<span className={getOrderStatusClass(bid.status, 'dp-table-cell')}>{bid.quantity}</span>),
  weight: 3,
  template: '9999.99',
}, {
  name: 'ofr-size',
  header: () => null,
  render: ({ofr}: any) => (<span className={getOrderStatusClass(ofr.status, 'dp-table-cell')}>{ofr.quantity}</span>),
  weight: 3,
  template: '9999.99',
}, {
  name: 'ofr-firm',
  header: () => null,
  render: ({ofr}: any) => (<span className={getOrderStatusClass(ofr.status, 'dp-table-cell')}>{ofr.firm}</span>),
  weight: 2,
  template: 'FIRM',
}];

export default columns;
