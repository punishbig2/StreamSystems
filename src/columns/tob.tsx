import {TOBPrice} from 'columns/tobPrice';
import {TOBQty as Qty} from 'columns/tobQty';
import {DualTableHeader} from 'components/dualTableHeader';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBHandlers} from 'components/TOB/handlers';
import {RowFunctions} from 'components/TOB/rowFunctions';
import {EntryTypes} from 'interfaces/mdEntry';
import {EntryStatus} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

type RowType = TOBRow & { handlers: TOBHandlers, user: User, depths: { [key: string]: TOBTable } } & RowFunctions;

const columns = (handlers: TOBHandlers): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <DualTableHeader label={''}/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={(tenor: string) => handlers.onTenorSelected(tenor)}/>
  ),
  weight: 1,
}, {
  name: 'bid-size',
  header: () => <DualTableHeader label={strings.BidSz}/>,
  render: ({bid, user, setBidQuantity}: RowType) => (
    <Qty entry={bid} onCancel={handlers.onCancelOrder} onChange={setBidQuantity}
         onSubmit={handlers.onQuantityChange} user={user}/>
  ),
  weight: 2,
}, {
  name: 'bid-vol',
  header: () => <DualTableHeader label={strings.BidPx}
                                 action={{fn: handlers.onRefBidsButtonClicked, label: strings.RefBids}}/>,
  render: ({bid, depths}: RowType) => (
    <TOBPrice depths={depths} entry={bid} onChange={handlers.onPriceChange} onDoubleClick={handlers.onDoubleClick}
              onUpdate={handlers.onUpdateOrder}/>
  ),
  weight: 3,
}, {
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
}, {
  name: 'ofr-vol',
  header: () => <DualTableHeader label={strings.OfrPx}
                                 action={{fn: handlers.onRefOfrsButtonClicked, label: strings.RefBids}}/>,
  render: ({ofr, depths}: RowType) => (
    <TOBPrice depths={depths} entry={ofr} onChange={handlers.onPriceChange} onDoubleClick={handlers.onDoubleClick}
              onUpdate={handlers.onUpdateOrder}/>
  ),
  weight: 3,
}, {
  name: 'ofr-quantity',
  header: () => <DualTableHeader label={'Ofr Sz'} action={{fn: handlers.onRunButtonClicked, label: strings.Run}}/>,
  render: ({ofr, user, setOfrQuantity}: RowType) => (
    <Qty entry={ofr} onCancel={handlers.onCancelOrder} onChange={setOfrQuantity} onSubmit={handlers.onQuantityChange}
         user={user}/>
  ),
  weight: 2,
}];

export default columns;

