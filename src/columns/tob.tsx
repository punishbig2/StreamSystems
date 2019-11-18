import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBHandlers} from 'components/TOB/handlers';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {ArrowDirection} from 'interfaces/w';
import strings from 'locales';
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

const columns = (handlers: TOBHandlers): ColumnSpec[] => [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={(tenor: string) => handlers.onTenorSelected(tenor)}/>
  ),
  weight: 1,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: ({bid, user, setBidQuantity}: RowType) => {
    return (
      <QuantityWrapper entry={bid} type={EntryTypes.Bid} onChange={setBidQuantity} onCancel={handlers.onCancelOrder}
                       user={user}/>
    );
  },
  weight: 2,
}, {
  name: 'bid',
  header: () => <button onClick={handlers.onRefBidsButtonClicked}>{strings.RefBids}</button>,
  render: ({bid, user, setBidPrice}: RowType) => {
    if (bid.price === null && user.email !== bid.user) {
    }
    return (
      <Price
        editable={user.email === bid.user}
        table={[]}
        arrow={bid.arrowDirection}
        type={EntryTypes.Bid}
        onSubmit={() => handlers.onUpdateOrder(bid)}
        onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, bid)}
        onValidChange={setBidPrice}
        value={bid.price}
        color={user.email === bid.user ? 'red' : 'black'}
        onBlur={() => handlers.onPriceBlur(bid)}/>
    );
  },
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <div/>,
  render: () => (
    <Price
      editable={false}
      arrow={ArrowDirection.None}
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
  header: () => (
    <button onClick={handlers.onRefOffersButtonClicked}>{strings.RefOffrs}</button>
  ),
  render: ({offer, user, setOfferPrice}: RowType) => (
    <Price
      editable={user.email === offer.user}
      table={[]}
      arrow={offer.arrowDirection}
      type={EntryTypes.Offer}
      onSubmit={() => handlers.onUpdateOrder(offer)}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Offer, offer)}
      onValidChange={setOfferPrice}
      value={offer.price}
      color={user.email === offer.user ? 'red' : 'black'}
      onBlur={() => handlers.onPriceBlur(offer)}/>
  ),
  weight: 3,
}, {
  name: 'offer-quantity',
  header: () => (
    <button onClick={handlers.onRunButtonClicked}>{strings.Run}</button>
  ),
  render: ({offer, user, setOfferQuantity}: RowType) => (
    <QuantityWrapper entry={offer} type={EntryTypes.Offer} onChange={setOfferQuantity} onCancel={handlers.onCancelOrder}
                     user={user}/>

  ),
  weight: 2,
}];

export default columns;

