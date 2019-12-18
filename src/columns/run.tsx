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

type RowType = TOBRow & { defaultBidSize: number, defaultOfrSize: number };

const columns = (data: RunColumnData): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <span>&nbsp;</span>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-quantity',
  header: () => <HeaderQty {...data.defaultBidSize}/>,
  render: ({id, bid}: RowType) => {
    const {defaultBidSize} = data;
    return (
      <RunQuantity id={id}
                   value={bid.quantity}
                   order={bid}
                   defaultValue={defaultBidSize.value}
                   onTabbedOut={data.focusNext}
                   onChange={data.onBidQtyChanged}
                   onCancel={data.onCancelOrder}/>
    );
  },
  weight: 3,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({id, bid}: RowType) => (
    <Price value={bid.price}
           arrow={ArrowDirection.None} status={bid.status}
           onChange={(price: number | null) => data.onBidChanged(id, price)}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Bid)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}, {
  name: 'ofr-price',
  header: () => <div>{strings.Ofr}</div>,
  render: ({id, ofr}: RowType) => (
    <Price value={ofr.price}
           arrow={ArrowDirection.None} status={ofr.status}
           onChange={(price: number | null) => data.onOfrChanged(id, price)}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Ofr)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}, {
  name: 'ofr-quantity',
  header: () => <HeaderQty {...data.defaultOfrSize}/>,
  render: ({id, ofr}: RowType) => {
    const {defaultOfrSize} = data;
    return (
      <RunQuantity id={id}
                   value={ofr.quantity}
                   order={ofr}
                   defaultValue={defaultOfrSize.value}
                   onTabbedOut={data.focusNext}
                   onChange={data.onOfrQtyChanged}
                   onCancel={data.onCancelOrder}/>
    );
  },
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({id, mid}: RowType) => (
    <Price value={mid}
           className={'mid'} arrow={ArrowDirection.None} status={OrderStatus.None}
           onChange={(value: number | null) => data.onMidChanged(id, value)}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Mid)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({id, spread}: RowType) => (
    <Price value={spread}
           className={'spread'}
           arrow={ArrowDirection.None}
           status={OrderStatus.None}
           onChange={(value: number | null) => data.onSpreadChanged(id, value)}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Spread)}
           onNavigate={data.onNavigate}/>
  ),
  weight: 4,
}];

export default columns;
