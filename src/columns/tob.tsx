import {Button} from '@blueprintjs/core';
import {TOBHandlers} from 'components/Table';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBRow} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import React from 'react';

type RowType = TOBRow & { handlers: TOBHandlers } & { user: User };
const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor, handlers}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={handlers.onTenorSelected}/>
  ),
  weight: 1,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: ({bid, user, handlers}: RowType) => (
    <Quantity
      value={bid.quantity ? bid.quantity : 10}
      type={EntryTypes.Bid}
      onChange={() => handlers.onSizeChanged(bid)}
      onButtonClicked={() => handlers.onBidCanceled(bid)}
      firm={user.isBroker ? bid.firm : undefined}/>
  ),
  weight: 2,
}, {
  name: 'bid',
  header: ({handlers}) => <Button onClick={handlers.onRefBidsButtonClicked} text={'Ref. Bid'} intent={'none'} small/>,
  render: ({bid, user, handlers}: RowType) => {
    return (
      <Price
        editable={user.id === bid.user || bid.user === undefined}
        table={bid.table}
        type={EntryTypes.Bid}
        onSubmit={(value: number) => handlers.onOrderPlaced(bid, value)}
        onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, bid)}
        onChange={(price: number) => handlers.onPriceChanged({...bid, price})}
        value={bid.price}/>
    );
  },
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
  header: ({handlers}) => <Button onClick={handlers.onRefOffersButtonClicked} text={'Ref. Ofr'} intent={'none'} small/>,
  render: ({offer, user, handlers}: RowType) => (
    <Price
      editable={user.id === offer.user}
      table={offer.table}
      type={EntryTypes.Ask}
      onSubmit={(value: number) => handlers.onOrderPlaced(offer, value)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Ask, offer)}
      onChange={(price: number) => handlers.onPriceChanged({...offer, price})}
      value={offer.price}/>
  ),
  weight: 3,
}, {
  name: 'offer-quantity',
  header: ({handlers}) => <Button onClick={handlers.onRunButtonClicked} text={'Run'} intent={'none'} small/>,
  render: ({offer, user, handlers}: RowType) => (
    <Quantity
      value={offer.quantity ? offer.quantity : 10}
      type={EntryTypes.Ask}
      onChange={() => handlers.onSizeChanged(offer)}
      onButtonClicked={() => handlers.onOfferCanceled(offer)}
      firm={user.isBroker ? offer.firm : undefined}/>
  ),
  weight: 2,
}];

export default columns;

