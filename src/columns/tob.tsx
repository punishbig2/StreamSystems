import {TOBPrice} from 'columns/tobPrice';
import {TOBQty} from 'columns/tobQty';
import {DualTableHeader, HeaderAction} from 'components/dualTableHeader';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBColumnData} from 'components/TOB/data';
import {AggregatedSz} from 'components/TOB/reducer';
import {RowFunctions} from 'components/TOB/rowFunctions';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { handlers: TOBColumnData, depths: { [key: string]: TOBTable } } & RowFunctions;
type Type = 'bid' | 'ofr';

const getDepthStatus = (values: Order[]): OrderStatus => {
  const filtered: Order[] = values.filter((order: Order) => order.price !== null && order.quantity !== null);
  if (filtered.length <= 1)
    return OrderStatus.None;
  return OrderStatus.HasDepth;
};

const getChevronStatus = (depths: { [key: string]: TOBTable }, tenor: string, type: OrderTypes): OrderStatus => {
  const order: TOBTable | undefined = depths[tenor];
  if (!order)
    return OrderStatus.None;
  const isEntryMineAndValid = (order: Order): boolean => {
    if ((order.status & OrderStatus.Owned) === 0 || (order.status & OrderStatus.PreFilled) === 0)
      return false;
    return (order.status & OrderStatus.Cancelled) === 0;
  };
  const values: TOBRow[] = Object.values(order);
  const isMyOfr: ({ofr}: TOBRow) => boolean = ({ofr}: TOBRow) => isEntryMineAndValid(ofr);
  const ofrDepthStatus: OrderStatus = getDepthStatus(values.map(({ofr}: TOBRow) => ofr));
  const isMyBid: ({bid}: TOBRow) => boolean = ({bid}: TOBRow) => isEntryMineAndValid(bid);
  const bidDepthStatus: OrderStatus = getDepthStatus(values.map(({bid}: TOBRow) => bid));
  switch (type) {
    case OrderTypes.Invalid:
      break;
    case OrderTypes.Ofr:
      return (values.find(isMyOfr) ? OrderStatus.HaveOrders : OrderStatus.None) | ofrDepthStatus;
    case OrderTypes.Bid:
      return (values.find(isMyBid) ? OrderStatus.HaveOrders : OrderStatus.None) | bidDepthStatus;
    case OrderTypes.DarkPool:
      break;
  }
  return OrderStatus.None;
};

const getAggregatedSize = (aggregatedSz: AggregatedSz | undefined, order: Order, index: 'ofr' | 'bid'): number | null => {
  if (aggregatedSz) {
    const price: number | null = order.price;
    const key: string | null = price === null ? null : price.toFixed(3);
    if (aggregatedSz[order.tenor] && key !== null)
      return aggregatedSz[order.tenor][index][key];
    return order.quantity;
  } else {
    return order.quantity;
  }
};

const QtyColumn = (label: string, type: Type, data: TOBColumnData, depth: boolean, action?: HeaderAction): ColumnSpec => {
  return {
    name: `${type}-sz`,
    header: () => <DualTableHeader label={label} action={action} disabled={!data.buttonsEnabled}/>,
    render: ({[type]: originalOrder, depths}: RowType) => {
      const quantity = depth ? originalOrder.quantity : getAggregatedSize(data.aggregatedSz, originalOrder, type);
      const order: Order = {...originalOrder, quantity};
      const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type) | order.status;
      if (order.status !== status) {
        return (
          <TOBQty order={{...order, status: status}}
                  isDepth={depth}
                  value={order.quantity}
                  onCancel={data.onCancelOrder}
                  onSubmit={data.onQuantityChange}/>
        );
      } else {
        return (
          <TOBQty order={order}
                  isDepth={depth}
                  value={order.quantity}
                  onCancel={data.onCancelOrder}
                  onSubmit={data.onQuantityChange}/>
        );
      }
    },
    template: '999999',
    weight: 5,
  };
};

const getPriceIfApplies = (order: Order | undefined): number | undefined => {
  if (order === undefined)
    return undefined;
  if ((order.status & OrderStatus.SameBank) !== 0)
    return order.price as number;
  return undefined;
};

const isNonEmpty = (order: Order) => order.price !== null && order.quantity !== null;
const VolColumn = (data: TOBColumnData, label: string, type: Type, action?: HeaderAction): ColumnSpec => {
  return ({
    name: `${type}-vol`,
    header: () => <DualTableHeader label={label} action={action} disabled={!data.buttonsEnabled}/>,
    render: (row: RowType) => {
      const {[type]: order, depths} = row;
      const bid: Order | undefined = type === 'ofr' ? row.bid : undefined;
      const ofr: Order | undefined = type === 'bid' ? row.ofr : undefined;
      const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type) | order.status;
      return (
        <TOBPrice depths={depths}
                  order={{...order, status}}
                  onChange={data.onOrderModified}
                  min={getPriceIfApplies(bid)}
                  max={getPriceIfApplies(ofr)}
                  onTabbedOut={data.onTabbedOut}
                  onDoubleClick={isNonEmpty(order) ? data.onDoubleClick : undefined}
                  onError={data.onOrderError}/>
      );
    },
    template: '999999.999',
    weight: 7,
  });
};

const DarkPoolColumn = (data: TOBColumnData): ColumnSpec => ({
  name: 'dark-pool',
  header: () => (
    <div className={'dark-pool-header'}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: (row: RowType) => (
    <Price
      arrow={ArrowDirection.None}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={data.onDarkPoolDoubleClicked}
      onChange={(value: number | null) => value ? data.onDarkPoolPriceChanged(row.tenor, Number(value)) : undefined}
      onTabbedOut={(input: HTMLInputElement) => data.onTabbedOut(input, OrderTypes.DarkPool)}
      value={row.darkPrice}
      readOnly={!data.isBroker}
      status={OrderStatus.None}/>
  ),
  template: '999999.99',
  weight: 5,
});

const TenorColumn = (data: TOBColumnData): ColumnSpec => ({
  name: 'tenor',
  header: () => <DualTableHeader label={''}/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={(tenor: string) => data.onTenorSelected(tenor)}/>
  ),
  template: 'WW',
  weight: 2,
});

const FirmColumn = (data: TOBColumnData, type: 'ofr' | 'bid'): ColumnSpec => ({
  name: `${type}-firm`,
  header: () => <DualTableHeader label={''}/>,
  render: (row: RowType) => {
    const {[type]: {firm}} = row;
    return (
      <div className={'firm'}>{firm}</div>
    );
  },
  template: ' BANK ',
  weight: 3,
});

const columns = (data: TOBColumnData, depth: boolean = false): ColumnSpec[] => [
  TenorColumn(data),
  QtyColumn(strings.BidSz, 'bid', data, depth),
  ...(data.isBroker ? [FirmColumn(data, 'bid')] : []),
  VolColumn(data, strings.BidPx, 'bid', !depth ? {
    fn: data.onRefBidsButtonClicked,
    label: strings.RefBids,
  } : undefined),
  DarkPoolColumn(data),
  VolColumn(data, strings.OfrPx, 'ofr', !depth ? {
    fn: data.onRefOfrsButtonClicked,
    label: strings.RefOfrs,
  } : undefined),
  ...(data.isBroker ? [FirmColumn(data, 'ofr')] : []),
  QtyColumn(strings.OfrSz, 'ofr', data, depth),
];

export default columns;

