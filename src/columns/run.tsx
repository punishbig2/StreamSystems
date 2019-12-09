import {HeaderQty} from 'columns/HeaderQty';
import {RunQuantity} from 'columns/RunQuantity';
import {RunColumnData} from 'components/Run/columnData';
import {RunActions} from 'components/Run/enumerator';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { defaultBidQty: number, defaultOfrQty: number };

const columns = (data: RunColumnData): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <span>&nbsp;</span>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-quantity',
  header: () => <HeaderQty {...data.defaultBidQty}/>,
  render: ({id, bid}: RowType) => {
    const {defaultBidQty} = data;
    return (
      <RunQuantity id={id} value={bid.quantity} order={bid} defaultValue={defaultBidQty.value}
                   onChange={data.onBidQtyChanged} onCancel={data.onCancelOrder}/>
    );
  },
  weight: 3,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({id, bid}: RowType) => (
    <Price value={bid.price}
           onChange={(price: number | null) => data.onBidChanged(id, price)}
           arrow={ArrowDirection.None} status={bid.status}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Bid)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}, {
  name: 'ofr-price',
  header: () => <div>{strings.Ofr}</div>,
  render: ({id, ofr}: RowType) => (
    <Price value={ofr.price}
           onChange={(price: number | null) => data.onOfrChanged(id, price)}
           arrow={ArrowDirection.None} status={ofr.status}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Ofr)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}, {
  name: 'ofr-quantity',
  header: () => <HeaderQty {...data.defaultOfrQty}/>,
  render: ({id, ofr}: RowType) => {
    const {defaultOfrQty} = data;
    return (
      <RunQuantity id={id} value={ofr.quantity} order={ofr} defaultValue={defaultOfrQty.value}
                   onChange={data.onOfrQtyChanged} onCancel={data.onCancelOrder}/>
    );
  },
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({id, mid}: RowType) => (
    <Price value={mid}
           onChange={(value: number | null) => data.onMidChanged(id, value)}
           className={'mid'} arrow={ArrowDirection.None} status={OrderStatus.None}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Mid)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({id, spread}: RowType) => (
    <Price value={spread}
           onChange={(value: number | null) => data.onSpreadChanged(id, value)}
           className={'spread'}
           arrow={ArrowDirection.None}
           status={OrderStatus.None}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Spread)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}];

export default columns;
