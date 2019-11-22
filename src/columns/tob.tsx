import {TOBPrice} from 'columns/tobPrice';
import {TOBQty as TOBQty} from 'columns/tobQty';
import {DualTableHeader, HeaderAction} from 'components/dualTableHeader';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBHandlers} from 'components/TOB/handlers';
import {AggregatedSz} from 'components/TOB/reducer';
import {RowFunctions} from 'components/TOB/rowFunctions';
import {EntryTypes} from 'interfaces/mdEntry';
import {EntryStatus, Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { handlers: TOBHandlers, user: User, depths: { [key: string]: TOBTable } } & RowFunctions;
type Type = 'bid' | 'ofr';
type SetQty = 'setBidQty' | 'setOfrQty';

function getChevronStatus(depths: { [key: string]: TOBTable }, tenor: string, type: EntryTypes): EntryStatus {
  const entry: TOBTable | undefined = depths[tenor];
  if (!entry)
    return EntryStatus.None;
  const isEntryMineAndValid = (entry: Order): boolean => {
    if ((entry.status & EntryStatus.Owned) === 0 || (entry.status & EntryStatus.PreFilled) === 0)
      return false;
    return (entry.status & EntryStatus.Cancelled) === 0;
  };
  const values: TOBRow[] = Object.values(entry);
  const isMyOfr: ({ofr}: TOBRow) => boolean = ({ofr}: TOBRow) => isEntryMineAndValid(ofr);
  const isMyBid: ({bid}: TOBRow) => boolean = ({bid}: TOBRow) => isEntryMineAndValid(bid);
  switch (type) {
    case EntryTypes.Invalid:
      break;
    case EntryTypes.Ofr:
      return values.find(isMyOfr) ? EntryStatus.HaveOtherOrders : EntryStatus.None;
    case EntryTypes.Bid:
      return values.find(isMyBid) ? EntryStatus.HaveOtherOrders : EntryStatus.None;
    case EntryTypes.DarkPool:
      break;
  }
  return EntryStatus.None;
}

const getAggregatedSize = (aggregatedSz: AggregatedSz | undefined, entry: Order, index: 'ofr' | 'bid'): number | null => {
  if (aggregatedSz) {
    const price: number | null = entry.price;
    const key: string | null = price === null ? null : price.toFixed(3);
    if (aggregatedSz[entry.tenor] && key !== null)
      return aggregatedSz[entry.tenor][index][key];
    return entry.quantity;
  } else {
    return entry.quantity;
  }
};

const QtyColumn = (label: string, type: Type, handlers: TOBHandlers, onChangeKey: SetQty, action?: HeaderAction): ColumnSpec => {
  return {
    name: `${type}-sz`,
    header: () => <DualTableHeader label={label} action={action}/>,
    render: ({[type]: originalEntry, depths, [onChangeKey]: onChange, user}: RowType) => {
      // Replace the actually quantity with the aggregated quantity if present
      const entry: Order = {...originalEntry, quantity: getAggregatedSize(handlers.aggregatedSz, originalEntry, type)};
      const status: EntryStatus = getChevronStatus(depths, entry.tenor, entry.type) | entry.status;
      // Return the input item (which in turn also has a X for cancellation)
      return (
        <TOBQty entry={{...entry, status: status}}
                onCancel={handlers.onCancelOrder}
                onChange={onChange}
                onSubmit={handlers.onQuantityChange}
                user={user}/>
      );
    },
    weight: 2,
  };
};

const VolColumn = (handlers: TOBHandlers, label: string, type: Type, action: HeaderAction): ColumnSpec => ({
  name: `${type}-vol`,
  header: () => <DualTableHeader label={strings.BidPx} action={action}/>,
  render: ({[type]: entry, depths}: RowType) => {
    const status: EntryStatus = getChevronStatus(depths, entry.tenor, entry.type) | entry.status;
    return (
      <TOBPrice depths={depths}
                entry={{...entry, status}}
                onChange={handlers.onPriceChange}
                onDoubleClick={handlers.onDoubleClick}
                onUpdate={handlers.onUpdateOrder}/>
    );
  },
  weight: 3,
});

const DarkPoolColumn: ColumnSpec = {
  name: 'dark-pool',
  header: () => <DualTableHeader label={strings.DarkPool}/>,
  render: () => (
    <Price
      arrow={ArrowDirection.None}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={() => console.log(EntryTypes.DarkPool, {})}
      onChange={() => null}
      value={null}
      status={EntryStatus.None}
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

