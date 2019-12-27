import {HeaderQty} from 'columns/HeaderQty';
import {RunQuantity} from 'columns/RunQuantity';
import {RunColumnData} from 'components/Run/columnData';
import {RunActions} from 'components/Run/enumerator';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { defaultBidSize: number, defaultOfrSize: number };

const RunPxCol = (data: RunColumnData, type: 'bid' | 'ofr'): ColumnSpec => {
  return {
    name: `${type}-price`,
    header: () => <div>{strings.Bid}</div>,
    render: (row: RowType) => {
      const order: Order = row[type];
      return (
        <Price value={order.price}
               arrow={ArrowDirection.None}
               status={order.status}
               onChange={(price: number | null) => data.onBidChanged(row.id, price)}
               onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Bid)}
               onNavigate={data.onNavigate}/>
      );
    },
    template: '999999.99',
    weight: 4,
  };
};

const RunQtyCol = (data: RunColumnData, type: 'bid' | 'ofr'): ColumnSpec => {
  return {
    name: `${type}-quantity`,
    header: () => <HeaderQty {...data.defaultBidSize}/>,
    render: (row: RowType) => {
      const {defaultBidSize} = data;
      const order: Order = row[type];
      return (
        <RunQuantity id={row.id}
                     value={order.quantity}
                     order={order}
                     defaultValue={defaultBidSize.value}
                     onTabbedOut={data.focusNext}
                     onChange={data.onBidQtyChanged}
                     onCancel={data.onCancelOrder}/>
      );
    },
    template: '999999',
    weight: 3,
  };
};

const TenorColumn: ColumnSpec = {
  name: 'tenor',
  header: () => <span>&nbsp;</span>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  template: 'WW',
  weight: 2,
};

const MidCol = (data: RunColumnData) => ({
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({id, mid}: RowType) => (
    <Price value={mid}
           className={'mid'} arrow={ArrowDirection.None} status={OrderStatus.None}
           onChange={(value: number | null) => data.onMidChanged(id, value)}
           onTabbedOut={(target: HTMLInputElement) => data.focusNext(target, RunActions.Mid)}
           onNavigate={data.onNavigate}/>
  ),
  template: '999999.99',
  weight: 4,
});

const SpreadCol = (data: RunColumnData) => ({
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
  template: '999999.99',
  weight: 4,
});

const columns = (data: RunColumnData): ColumnSpec[] => [
  TenorColumn,
  RunQtyCol(data, 'bid'),
  RunPxCol(data, 'bid'),
  RunPxCol(data, 'ofr'),
  RunQtyCol(data, 'ofr'),
  MidCol(data),
  SpreadCol(data),
];

export default columns;

