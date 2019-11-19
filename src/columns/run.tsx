import {RunHandlers} from 'components/Run/handlers';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TableInput} from 'components/TableInput';
import {TOBRow} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { defaultBidQty: number, defaultOfrQty: number };
const toQuantity = (value: number | null, defaultValue: number): string => {
  if (value === null)
    return defaultValue.toFixed(0);
  return value.toFixed(0);
};

const columns = (handlers: RunHandlers): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-quantity',
  header: () => <input className={'runs-quantity-input'} defaultValue={'10'}/>,
  render: ({id, bid, defaultBidQty}: RowType) => (
    <TableInput value={toQuantity(bid.quantity, defaultBidQty)}
                onChange={(value: string) => handlers.onBidQtyChanged(id, value)}/>
  ),
  weight: 3,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({id, bid}: RowType) => (
    <Price value={bid.price} onChange={(price: string) => handlers.onBidChanged(id, price)}
           editable={true} arrow={ArrowDirection.None} initialStatus={bid.status}/>
  ),
  weight: 4,
}, {
  name: 'offer-price',
  header: () => <div>{strings.Offer}</div>,
  render: ({id, offer}: RowType) => (
    <Price value={offer.price} onChange={(price: string) => handlers.onOfferChanged(id, price)}
           editable={true} arrow={ArrowDirection.None} initialStatus={offer.status}/>
  ),
  weight: 4,
}, {
  name: 'offer-quantity',
  header: () => <input className={'runs-quantity-input'} defaultValue={'10'}/>,
  render: ({id, offer, defaultOfrQty}: RowType) => (
    <TableInput value={toQuantity(offer.quantity, defaultOfrQty)}
                onChange={(value: string) => handlers.onOfferQtyChanged(id, value)}/>
  ),
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({id, mid}: RowType) => (
    <Price value={mid} onChange={(value: string) => handlers.onMidChanged(id, value)}
           className={'mid'} editable={true} arrow={ArrowDirection.None}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({id, spread}: RowType) => (
    <Price value={spread} onChange={(value: string) => handlers.onSpreadChanged(id, value)}
           className={'spread'} editable={true} arrow={ArrowDirection.None}/>
  ),
  weight: 4,
}];

export default columns;
