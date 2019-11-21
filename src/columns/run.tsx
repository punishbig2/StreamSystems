import {HeaderQty} from 'columns/HeaderQty';
import {RunQuantity} from 'columns/RunQuantity';
import {RunHandlers} from 'components/Run/handlers';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {EntryStatus} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { defaultBidQty: number, defaultOfrQty: number };

const columns = (handlers: RunHandlers): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-quantity',
  header: () => <HeaderQty {...handlers.defaultBidQty}/>,
  render: ({id, bid}: RowType) => {
    const {defaultBidQty} = handlers;
    return (
      <RunQuantity id={id} value={bid.quantity} defaultValue={defaultBidQty.value} onChange={handlers.onBidQtyChanged}/>
    );
  },
  weight: 3,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({id, bid}: RowType) => (
    <Price value={bid.price} onChange={(price: number) => handlers.onBidChanged(id, price)}
           arrow={ArrowDirection.None} status={bid.status}/>
  ),
  weight: 4,
}, {
  name: 'ofr-price',
  header: () => <div>{strings.Ofr}</div>,
  render: ({id, ofr}: RowType) => (
    <Price value={ofr.price} onChange={(price: number) => handlers.onOfrChanged(id, price)}
           arrow={ArrowDirection.None} status={ofr.status}/>
  ),
  weight: 4,
}, {
  name: 'ofr-quantity',
  header: () => <HeaderQty {...handlers.defaultOfrQty}/>,
  render: ({id, ofr}: RowType) => {
    const {defaultOfrQty} = handlers;
    return (
      <RunQuantity id={id} value={ofr.quantity} defaultValue={defaultOfrQty.value} onChange={handlers.onOfrQtyChanged}/>
    );
  },
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({id, mid}: RowType) => (
    <Price value={mid} onChange={(value: number) => handlers.onMidChanged(id, value)}
           className={'mid'} arrow={ArrowDirection.None} status={EntryStatus.None}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({id, spread}: RowType) => (
    <Price value={spread} onChange={(value: number) => handlers.onSpreadChanged(id, value)}
           className={'spread'} arrow={ArrowDirection.None} status={EntryStatus.None}/>
  ),
  weight: 4,
}];

export default columns;
