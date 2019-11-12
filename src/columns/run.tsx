import {RunHandlers} from 'components/Run/handlers';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TableInput} from 'components/TableInput';
import {TOBRow} from 'interfaces/tobRow';
import React from 'react';
import strings from 'locales';

const columns = (handlers: RunHandlers): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor}: TOBRow) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: ({id, bid}: TOBRow) => (
    <TableInput value={bid.quantity} color={'black'}
                onChange={(value: string) => handlers.onBidQtyChanged(id, Number(value))}/>
  ),
  weight: 3,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({id, bid}: TOBRow) => (
    <Price value={bid.price} color={'black'} onChange={(price: number) => handlers.onBidChanged(id, price)}
           editable={true}/>
  ),
  weight: 4,
}, {
  name: 'offer-price',
  header: () => <div>{strings.Offer}</div>,
  render: ({id, offer}: TOBRow) => (
    <Price value={offer.price} color={'black'} onChange={(price: number) => handlers.onOfferChanged(id, price)}
           editable={true}/>
  ),
  weight: 4,
}, {
  name: 'offer-quantity',
  header: () => <div/>,
  render: ({id, offer}: TOBRow) => (
    <TableInput value={offer.quantity} color={'black'}
                onChange={(value: string) => handlers.onOfferQtyChanged(id, Number(value))}/>
  ),
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({id, mid}: TOBRow) => (
    <Price value={mid} color={'blue'} onChange={(value: number) => handlers.onMidChanged(id, value)}
           editable={true}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({id, spread}: TOBRow) => (
    <Price value={spread} color={'green'} onChange={(value: number) => handlers.onSpreadChanged(id, value)}
           editable={true}></Price>
  ),
  weight: 4,
}];

export default columns;
