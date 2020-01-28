import {HeaderQty} from 'components/HeaderQty';
import {RunQuantity} from 'components/RunQuantity';
import {RunColumnData} from 'components/Run/columnData';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';
import {RunActions} from 'redux/reducers/runReducer';
import {DualTableHeader} from 'components/dualTableHeader';

type RowType = TOBRow & { defaultBidSize: number; defaultOfrSize: number };

const RunPxCol = (data: RunColumnData, type: 'bid' | 'ofr'): ColumnSpec => {
  const onChange = type === 'bid' ? data.onBidChanged : data.onOfrChanged;
  const label: string = type === 'bid' ? strings.Bid : strings.Ofr;
  const actionType: RunActions =
    type === 'bid' ? RunActions.Bid : RunActions.Ofr;
  return {
    name: `${type}-price`,
    header: () => <DualTableHeader label={label}/>,
    render: (row: RowType) => {
      const order: Order = row[type];
      return (
        <Price
          uid={`run-${order.uid()}${order.type}`}
          arrow={ArrowDirection.None}
          status={order.status}
          value={order.price}
          animated={false}
          onChange={(price: number | null, changed: boolean) =>
            onChange(row.id, price, changed)
          }
          onTabbedOut={(target: HTMLInputElement) =>
            data.focusNext(target, actionType)
          }
          onNavigate={data.onNavigate}/>
      );
    },
    template: '999999.99',
    weight: 4,
  };
};

const RunQtyCol = (data: RunColumnData, type: 'bid' | 'ofr'): ColumnSpec => {
  const defaultSize = type === 'bid' ? data.defaultBidSize : data.defaultOfrSize;
  const onChange = type === 'bid' ? data.onBidQtyChanged : data.onOfrQtyChanged;
  return {
    name: `${type}-quantity`,
    header: () => <HeaderQty onChange={defaultSize.onChange} value={defaultSize.value} type={defaultSize.type}/>,
    render: (row: RowType) => {
      const order: Order = row[type];
      return (
        <RunQuantity
          id={row.id}
          value={order.quantity}
          order={order}
          defaultValue={defaultSize.value}
          onTabbedOut={data.focusNext}
          onChange={onChange}
          onCancel={data.onCancelOrder}
          minSize={data.minSize}
        />
      );
    },
    template: '999999',
    weight: 3,
  };
};

const TenorColumn: ColumnSpec = {
  name: 'tenor',
  header: () => <DualTableHeader label={''}/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  template: 'WW',
  weight: 2,
};

const MidCol = (data: RunColumnData) => ({
  name: 'mid',
  header: () => <DualTableHeader label={strings.Mid}/>,
  render: ({id, mid}: RowType) => (
    <Price
      uid={`run-${id}-mid`}
      value={mid}
      className={'mid'}
      arrow={ArrowDirection.None}
      status={OrderStatus.None}
      onChange={(value: number | null, changed: boolean) =>
        data.onMidChanged(id, value, changed)
      }
      onTabbedOut={(target: HTMLInputElement) =>
        data.focusNext(target, RunActions.Mid)
      }
      onNavigate={data.onNavigate}
      animated={false}
    />
  ),
  template: '999999.99',
  weight: 4,
});

const SpreadCol = (data: RunColumnData) => ({
  name: 'spread',
  header: () => <DualTableHeader label={strings.Spread}/>,
  render: ({id, spread}: RowType) => {
    return (
      <Price
        uid={`run-${id}-spread`}
        value={spread}
        className={'spread'}
        arrow={ArrowDirection.None}
        status={OrderStatus.None}
        onChange={(value: number | null, changed: boolean) =>
          data.onSpreadChanged(id, value, changed)
        }
        onTabbedOut={(target: HTMLInputElement) =>
          data.focusNext(target, RunActions.Spread)
        }
        onNavigate={data.onNavigate}
        animated={false}
      />
    );
  },
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
