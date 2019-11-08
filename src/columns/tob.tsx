import {Button} from '@blueprintjs/core';
import {TOBHandlers} from 'components/Table';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
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

interface QWProps {
  entry: TOBEntry;
  type: EntryTypes;
  onChange: (value: number) => void;
  user: User;
  onCancel: (entry: TOBEntry) => void;
}

const QuantityWrapper: React.FC<QWProps> = (props: QWProps) => {
  const {entry, user} = props;
  return (
    <Quantity
      value={entry.quantity}
      type={props.type}
      onChange={props.onChange}
      cancelable={user.email === entry.user && entry.price !== null && entry.quantity !== null}
      onCancel={() => props.onCancel(entry)}
      firm={user.isBroker ? entry.firm : undefined}
      color={'blue'}/>
  );
};

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
  render: ({bid, user, handlers, setBidQuantity}: RowType) => {
    return (
      <QuantityWrapper entry={bid} type={EntryTypes.Bid} onChange={setBidQuantity} onCancel={handlers.onCancelOrder}
                       user={user}/>
    );
  },
  weight: 2,
}, {
  name: 'bid',
  header: ({handlers}) => <Button onClick={handlers.onRefBidsButtonClicked} text={'Ref. Bids'} intent={'none'} small/>,
  render: ({bid, user, handlers, setBidPrice}: RowType) => (
    <Price
      editable={user.email === bid.user}
      table={bid.table}
      type={EntryTypes.Bid}
      onSubmit={(value: number) => handlers.onCreateOrder(bid, value, EntryTypes.Bid)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, bid)}
      onChange={setBidPrice}
      value={bid.price}
      color={user.email === bid.user ? 'red' : 'black'}/>
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
      value={null}
      tabIndex={-1}
      color={'gray'}/>
  ),
  weight: 3,
}, {
  name: 'offer',
  header: ({handlers}: RowType) => (
    <Button onClick={handlers.onRefOffersButtonClicked} text={'Ref. Offers'} intent={'none'} small/>
  ),
  render: ({offer, user, handlers, setOfferPrice}: RowType) => (
    <Price
      editable={user.email === offer.user}
      table={offer.table}
      type={EntryTypes.Ask}
      onSubmit={(value: number) => handlers.onCreateOrder(offer, value, EntryTypes.Ask)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Ask, offer)}
      onChange={setOfferPrice}
      value={offer.price}
      color={user.email === offer.user ? 'red' : 'black'}/>
  ),
  weight: 3,
}, {
  name: 'offer-quantity',
  header: ({handlers, table}: RowType) => (
    <Button onClick={() => handlers.onRunButtonClicked()} text={'Run'} intent={'none'} small/>
  ),
  render: ({offer, user, handlers, setOfferQuantity}: RowType) => (
    <QuantityWrapper entry={offer} type={EntryTypes.Ask} onChange={setOfferQuantity} onCancel={handlers.onCancelOrder}
                     user={user}/>

  ),
  weight: 2,
}];

export default columns;

