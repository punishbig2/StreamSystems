import {RunHandlers} from 'components/Run/handlers';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TableInput} from 'components/TableInput';
import {TOBRow} from 'interfaces/tobRow';
import React from 'react';
import strings from 'locales';

type RowType = TOBRow & { handlers: RunHandlers };
const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: ({tenor, handlers, bid}: RowType) => (
    <TableInput value={bid.quantity || 10} color={'black'}
                onChange={(value: string) => handlers.onBidQtyChanged(tenor, Number(value))}/>
  ),
  weight: 3,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({tenor, handlers, bid}: RowType) => (
    <Price value={bid.price} color={'black'} onChange={(price: number) => handlers.onBidChanged(tenor, price)}
           editable={true}/>
  ),
  weight: 4,
}, {
  name: 'offer-price',
  header: () => <div>{strings.Offer}</div>,
  render: ({tenor, offer, handlers}: RowType) => (
    <Price value={offer.price} color={'black'} onChange={(price: number) => handlers.onOfferChanged(tenor, price)}
           editable={true}/>
  ),
  weight: 4,
}, {
  name: 'offer-quantity',
  header: () => <div/>,
  render: ({offer, handlers, tenor}: RowType) => (
    <TableInput value={offer.quantity || 10} color={'black'}
                onChange={(value: string) => handlers.onOfferQtyChanged(tenor, Number(value))}/>
  ),
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({tenor, handlers, mid}: RowType) => (
    <Price value={mid} color={'blue'} onChange={(value: number) => handlers.onMidChanged(tenor, value)}
           editable={true}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({tenor, handlers, spread}: RowType) => {
    return (
      <Price value={spread} color={'green'} onChange={(value: number) => handlers.onSpreadChanged(tenor, value)}
             editable={true}/>
    );
  },
  weight: 4,
}];

export default columns;
