import {TOBPrice} from 'columns/tobPrice';
import {TOBQty as Qty} from 'columns/tobQty';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBHandlers} from 'components/TOB/handlers';
import {RowFunctions} from 'components/TOB/rowFunctions';
import {EntryTypes} from 'interfaces/mdEntry';
import {OrderStatus, Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { handlers: TOBHandlers, user: User, depths: { [key: string]: TOBTable } } & RowFunctions;

const columns = (handlers: TOBHandlers): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <span>&nbsp;</span>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={(tenor: string) => handlers.onTenorSelected(tenor)}/>
  ),
  weight: 1,
}, {
  name: 'bid-size',
  header: () => strings.BidSz,
  render: ({bid, user, setBidQty}: RowType) => (
    <Qty entry={bid} onCancel={(order: Order) => handlers.onCancelOrder(order, false)} onChange={setBidQty}
         onSubmit={handlers.onQuantityChange} user={user}/>
  ),
  weight: 2,
}, {
  name: 'bid-vol',
  header: () => strings.BidPx,
  render: ({bid, depths}: RowType) => (
    <TOBPrice depths={depths} entry={bid} onChange={handlers.onPriceChange} onDoubleClick={handlers.onDoubleClick}
              onUpdate={handlers.onUpdateOrder}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => strings.DarkPool,
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
}, {
  name: 'ofr-vol',
  header: () => strings.OfrPx,
  render: ({ofr, depths}: RowType) => (
    <TOBPrice depths={depths} entry={ofr} onChange={handlers.onPriceChange} onDoubleClick={handlers.onDoubleClick}
              onUpdate={handlers.onUpdateOrder}/>
  ),
  weight: 3,
}, {
  name: 'ofr-quantity',
  header: () => strings.OfrSz,
  render: ({ofr, user, setOfrQty}: RowType) => (
    <Qty entry={ofr} onCancel={(order: Order) => handlers.onCancelOrder(order, false)} onChange={setOfrQty}
         onSubmit={handlers.onQuantityChange}
         user={user}/>
  ),
  weight: 2,
}];

export default columns;

