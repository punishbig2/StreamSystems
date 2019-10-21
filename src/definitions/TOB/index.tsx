import {Price} from 'components/Table/CellRenderers/Price';
import {PriceTypes} from 'components/Table/CellRenderers/Price/priceTypes';
import {Size} from 'components/Table/CellRenderers/Size';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Types} from 'models/mdEntry';
import React from 'react';

const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: (props: any) => (
    <Tenor tenor={props.tenor} onTenorSelected={props.handlers.onTenorSelected}/>
  ),
  weight: 1,
}, {
  name: 'bid-size',
  header: () => <div/>,
  render: ({bid, user}) => <Size value={bid.size} mine={user.id === bid.user} type={Types.Bid}/>,
  weight: 2,
}, {
  name: 'bid',
  header: () => <button>Ref. Bid</button>,
  render: ({bid, user}) => (
    <Price value={bid.price} mine={user.id === bid.user} dob={bid.dob} type={Types.Bid}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <div/>,
  render: () => <Price value={0} mine={false} priceType={PriceTypes.DarkPool}/>,
  weight: 3,
}, {
  name: 'ask',
  header: () => <button>Ref. Ofr</button>,
  render: ({ask, user}) => (
    <Price value={ask.price} mine={user.id === ask.user} dob={ask.dob} type={Types.Ask}/>
  ),
  weight: 3,
}, {
  name: 'ask-size',
  header: () => <button>Run</button>,
  render: ({ask, user}) => <Size value={ask.size} mine={user.id === ask.user} type={Types.Ask}/>,
  weight: 2,
}];

export default columns;
