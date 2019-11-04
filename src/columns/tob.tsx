import {Button} from '@blueprintjs/core';
import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Size} from 'components/Table/CellRenderers/Size';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
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
  render: ({bid, user}: { bid: TOBEntry, user: User }) => (
    <Size value={bid.size} type={EntryTypes.Bid} firm={user.isBroker ? bid.firm : undefined}/>
  ),
  weight: 2,
}, {
  name: 'bid',
  header: ({handlers}) => <Button onClick={handlers.onRefBidsButtonClicked} text={'Ref. Bid'} intent={'none'} small/>,
  render: ({bid, user, handlers}: { bid: TOBEntry, user: User, handlers: any }) => (
    <Price
      mine={user.id === bid.user}
      table={bid.table}
      type={EntryTypes.Bid}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Bid, bid)}
      onChange={(price: number) => handlers.onPriceChanged({...bid, price})}
      value={bid.price}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <div/>,
  render: () => (
    <Price
      mine={false}
      priceType={PriceTypes.DarkPool}
      onDoubleClick={() => console.log(EntryTypes.DarkPool, {})}
      onChange={() => null}
      value={null}/>
  ),
  weight: 3,
}, {
  name: 'ask',
  header: ({handlers}) => <Button onClick={handlers.onRefOfrsButtonClicked} text={'Ref. Ofr'} intent={'none'} small/>,
  render: ({ask, user, handlers}: { ask: TOBEntry, user: User, handlers: any }) => (
    <Price
      mine={user.id === ask.user}
      table={ask.table}
      type={EntryTypes.Ask}
      onDoubleClick={() => handlers.onDoubleClick(EntryTypes.Ask, ask)}
      onChange={(price: number) => handlers.onPriceChanged({...ask, price})}
      value={ask.price}/>
  ),
  weight: 3,
}, {
  name: 'ask-size',
  header: ({handlers}) => <Button onClick={handlers.onRunButtonClicked} text={'Run'} intent={'none'} small/>,
  render: ({ask, user}) => <Size value={ask.size} type={EntryTypes.Ask} firm={user.isBroker ? ask.firm : undefined}/>,
  weight: 2,
}];

export default columns;
