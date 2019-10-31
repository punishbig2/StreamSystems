import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Size} from 'components/Table/CellRenderers/Size';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Order} from 'interfaces/order';
import {EntryTypes} from 'interfaces/mdEntry';
import {User} from 'interfaces/user';
import React from 'react';

const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor, handlers}: { tenor: string, handlers: any }) => (
    <Tenor tenor={tenor} onTenorSelected={handlers.onTenorSelected}/>
  ),
  weight: 1,
}, {
  name: 'bid-size',
  header: () => <div/>,
  render: ({bid, user}: { bid: Order, user: User }) => (
    <Size value={bid.size} mine={user.id === bid.user} type={EntryTypes.Bid}/>
  ),
  weight: 2,
}, {
  name: 'bid',
  header: () => <button>Ref. Bid</button>,
  render: ({bid, user, handlers}: { bid: Order, user: User, handlers: any }) => (
    <Price
      value={bid.price}
      mine={user.id === bid.user}
      dob={bid.dob}
      type={EntryTypes.Bid}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, bid)}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <div/>,
  render: () => (
    <Price
      value={''}
      mine={false}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={() => console.log(EntryTypes.DarkPool, {})}/>
  ),
  weight: 3,
}, {
  name: 'ask',
  header: () => <button>Ref. Ofr</button>,
  render: ({ask, user, handlers}: { ask: Order, user: User, handlers: any }) => (
    <Price
      value={ask.price}
      mine={user.id === ask.user}
      dob={ask.dob}
      type={EntryTypes.Ask}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Ask, ask)}/>
  ),
  weight: 3,
}, {
  name: 'ask-size',
  header: () => <button>Run</button>,
  render: ({ask, user}) => <Size value={ask.size} mine={user.id === ask.user} type={EntryTypes.Ask}/>,
  weight: 2,
}];

export default columns;
