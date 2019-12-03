import {TOBPrice} from 'columns/tobPrice';
import {TOBQty} from 'columns/tobQty';
import {DualTableHeader, HeaderAction} from 'components/dualTableHeader';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBHandlers} from 'components/TOB/handlers';
import {AggregatedSz} from 'components/TOB/reducer';
import {RowFunctions} from 'components/TOB/rowFunctions';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { handlers: TOBHandlers, user: User, depths: { [key: string]: TOBTable } } & RowFunctions;
type Type = 'bid' | 'ofr';
type SetQty = 'setBidQty' | 'setOfrQty';

function getChevronStatus(depths: { [key: string]: TOBTable }, tenor: string, type: EntryTypes): OrderStatus {
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
  const isMyBid: ({bid}: TOBRow) => boolean = ({bid}: TOBRow) => isEntryMineAndValid(bid);
  switch (type) {
    case EntryTypes.Invalid:
      break;
    case EntryTypes.Ofr:
      return values.find(isMyOfr) ? OrderStatus.HaveOtherOrders : OrderStatus.None;
    case EntryTypes.Bid:
      return values.find(isMyBid) ? OrderStatus.HaveOtherOrders : OrderStatus.None;
    case EntryTypes.DarkPool:
      break;
  }
  return OrderStatus.None;
}

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

const QtyColumn = (label: string, type: Type, handlers: TOBHandlers, onChangeKey: SetQty, action?: HeaderAction): ColumnSpec => {
  return {
    name: `${type}-sz`,
    header: () => <DualTableHeader label={label} action={action}/>,
    render: ({[type]: originalEntry, depths, [onChangeKey]: onChange, user}: RowType) => {
      // Replace the actually quantity with the aggregated quantity if present
      const order: Order = {...originalEntry, quantity: getAggregatedSize(handlers.aggregatedSz, originalEntry, type)};
      const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type) | order.status;
      // Return the input item (which in turn also has a X for cancellation)
      return (
        <TOBQty order={{...order, status: status}}
                onCancel={handlers.onCancelOrder}
                onChange={onChange}
                onSubmit={handlers.onQuantityChange}
                user={user}/>
      );
    },
    weight: 2,
  };
};

const isNonEmpty = (order: Order) => order.price !== null && order.quantity !== null;
const VolColumn = (handlers: TOBHandlers, label: string, type: Type, action: HeaderAction): ColumnSpec => ({
  name: `${type}-vol`,
  header: () => <DualTableHeader label={strings.BidPx} action={action}/>,
  render: ({[type]: order, depths}: RowType) => {
    const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type) | order.status;
    return (
      <TOBPrice depths={depths}
                order={{...order, status}}
                onChange={handlers.onPriceChange}
                onDoubleClick={isNonEmpty(order) ? handlers.onDoubleClick : undefined}
                onUpdate={handlers.onUpdateOrder}/>
    );
  },
  weight: 3,
});

const DarkPoolColumn: ColumnSpec = {
  name: 'dark-pool',
  header: () => (
    <div className={'dark-pool-header'}>
      <div>Dark</div>
      <div>Pool</div>
    </div>
  ),
  render: () => (
    <Price
      arrow={ArrowDirection.None}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={() => console.log(EntryTypes.DarkPool, {})}
      onChange={() => null}
      value={null}
      status={OrderStatus.None}
      tabIndex={-1}/>
  ),
  weight: 3,
};

const TenorColumn = (handlers: TOBHandlers): ColumnSpec => ({
  name: 'tenor',
  header: () => <DualTableHeader label={''}/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={(tenor: string) => handlers.onTenorSelected(tenor)}/>
  ),
  weight: 1,
});

const columns = (handlers: TOBHandlers): ColumnSpec[] => [
  TenorColumn(handlers),
  QtyColumn(strings.BidSz, 'bid', handlers, 'setBidQty'),
  VolColumn(handlers, strings.BidPx, 'bid', {fn: handlers.onRefBidsButtonClicked, label: strings.RefBids}),
  DarkPoolColumn,
  VolColumn(handlers, strings.OfrPx, 'ofr', {fn: handlers.onRefOfrsButtonClicked, label: strings.RefOfrs}),
  QtyColumn(strings.OfrSz, 'ofr', handlers, 'setOfrQty', {fn: handlers.onRunButtonClicked, label: strings.Run}),
];

export default columns;

