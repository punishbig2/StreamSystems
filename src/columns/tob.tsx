import {Button} from '@blueprintjs/core';
import {TOBHandlers} from 'components/Table';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React from 'react';

interface RowHandlers {
  setOfferQuantity: (value: number) => void;
  setOfferPrice: (value: number) => void;
  setBidQuantity: (value: number) => void;
  setBidPrice: (value: number) => void;
}

type RowType = TOBRow & { handlers: TOBHandlers } & { user: User } & { table: TOBTable } & RowHandlers;

const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor, handlers, dob}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={(tenor: string) => handlers.onTenorSelected(tenor, dob as TOBTable)}/>
  ),
  weight: 1,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: ({bid, user, handlers, setBidQuantity}: RowType) => (
    <Quantity
      value={bid.quantity ? bid.quantity : 10}
      type={EntryTypes.Bid}
      onChange={setBidQuantity}
      onButtonClicked={() => handlers.onBidCanceled(bid)}
      cancelable={user.email === bid.user}
      onCancel={() => handlers.onCancelOrder(bid)}
      firm={user.isBroker ? bid.firm : undefined}/>
  ),
  weight: 2,
}, {
  name: 'bid',
  header: ({handlers}) => <Button onClick={handlers.onRefBidsButtonClicked} text={'Ref. Bid'} intent={'none'} small/>,
  render: ({bid, user, handlers, setBidPrice}: RowType) => (
    <Price
      editable={user.email === bid.user || bid.price === null}
      table={bid.table}
      type={EntryTypes.Bid}
      onSubmit={(value: number) => handlers.onCreateOrder(bid, value)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, bid)}
      onChange={setBidPrice}
      value={bid.price}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <div/>,
  render: () => (
    <Price
      editable={false}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={() => console.log(EntryTypes.DarkPool, {})}
      onChange={() => null}
      value={null}/>
  ),
  weight: 3,
}, {
  name: 'offer',
  header: ({handlers}: RowType) => (
    <Button onClick={handlers.onRefOffersButtonClicked} text={'Ref. Ofr'} intent={'none'} small/>
  ),
  render: ({offer, user, handlers, setOfferPrice}: RowType) => (
    <Price
      editable={user.email === offer.user || offer.price === null}
      table={offer.table}
      type={EntryTypes.Ask}
      onSubmit={(value: number) => handlers.onCreateOrder(offer, value)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Ask, offer)}
      onChange={setOfferPrice}
      value={offer.price}/>
  ),
  weight: 3,
}, {
  name: 'offer-quantity',
  header: ({handlers, table}: RowType) => (
    <Button onClick={() => handlers.onRunButtonClicked(table)} text={'Run'} intent={'none'} small/>
  ),
  render: ({offer, user, handlers, setOfferQuantity}: RowType) => (
    <Quantity
      value={offer.quantity ? offer.quantity : 10}
      type={EntryTypes.Ask}
      onChange={setOfferQuantity}
      onButtonClicked={() => handlers.onOfferCanceled(offer)}
      cancelable={user.email === offer.user}
      onCancel={() => handlers.onCancelOrder(offer)}
      firm={user.isBroker ? offer.firm : undefined}/>
  ),
  weight: 2,
}];

export default columns;

