import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {TOBQty as Qty} from 'columns/tobQty';
import {DualTableHeader} from 'components/dualTableHeader';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBHandlers} from 'components/TOB/handlers';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
import React from 'react';

interface RowHandlers {
  setOfferQuantity: (value: string) => void;
  setOfferPrice: (value: string) => void;
  setBidQuantity: (value: string) => void;
  setBidPrice: (value: string) => void;
}

type RowType = TOBRow & { handlers: TOBHandlers, user: User, depths: { [key: string]: TOBTable } } & RowHandlers;

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
  render: ({bid, user, setBidQuantity}: RowType) => {
    return (
      <Qty entry={bid} onCancel={handlers.onCancelOrder} onChange={setBidQuantity} user={user}/>
    );
  },
  weight: 2,
}, {
  name: 'bid-vol',
  header: () => <DualTableHeader label={strings.BidPx}
                                 action={{fn: handlers.onRefBidsButtonClicked, label: strings.RefBids}}/>,
  render: ({bid, depths, user, setBidPrice}: RowType) => (
    <Price
      editable={user.email === bid.user}
      depth={getMiniDOBByType(depths, bid.tenor, EntryTypes.Bid)}
      arrow={bid.arrowDirection}
      type={EntryTypes.Bid}
      onSubmit={() => handlers.onUpdateOrder(bid)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Offer, bid)}
      onChange={setBidPrice}
      value={bid.price}
      initialStatus={bid.status}
      onBlur={() => handlers.onPriceBlur(bid)}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <DualTableHeader label={strings.DarkPool}/>,
  render: () => (
    <Price
      editable={false}
      arrow={ArrowDirection.None}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={() => console.log(EntryTypes.DarkPool, {})}
      onChange={() => null}
      value={null}
      tabIndex={-1}/>
  ),
  weight: 3,
}, {
  name: 'offer-vol',
  header: () => <DualTableHeader label={strings.OfrPx}
                                 action={{fn: handlers.onRefOfrsButtonClicked, label: strings.RefBids}}/>,
  render: ({offer, depths, user, setOfferPrice}: RowType) => (
    <Price
      editable={user.email === offer.user}
      depth={getMiniDOBByType(depths, offer.tenor, EntryTypes.Offer)}
      arrow={offer.arrowDirection}
      type={EntryTypes.Offer}
      onSubmit={() => handlers.onUpdateOrder(offer)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, offer)}
      onChange={setOfferPrice}
      value={offer.price}
      onBlur={() => handlers.onPriceBlur(offer)}/>
  ),
  weight: 3,
}, {
  name: 'offer-quantity',
  header: () => <DualTableHeader label={'Ofr Sz'} action={{fn: handlers.onRunButtonClicked, label: strings.Run}}/>,
  render: ({offer, user, setOfferQuantity}: RowType) => (
    <Qty entry={offer} onCancel={handlers.onCancelOrder} onChange={setOfferQuantity} user={user}/>
  ),
  weight: 2,
}];

export default columns;

