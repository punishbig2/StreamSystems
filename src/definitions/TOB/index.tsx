import {Price, PriceTypes} from 'components/Table/CellRenderers/Price';
import {Size} from 'components/Table/CellRenderers/Size';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
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
  render: (props) => <Size value={props.bid.size} type={'ltr'}/>,
  weight: 2,
}, {
  name: 'bid',
  header: () => <button>Ref. Bid</button>,
  render: (props) => (
    <Price value={props.bid.price} editable={props.user.id === props.bid.user} dob={props.bid.dob}/>
  ),
  weight: 3,
}, {
  name: 'dark-pool',
  header: () => <div/>,
  render: () => <Price value={0} editable={false} type={PriceTypes.DarkPool}/>,
  weight: 3,
}, {
  name: 'ask',
  header: () => <button>Ref. Ofr</button>,
  render: (props) => <Price value={props.ask.price} editable={props.user.id === props.ask.user} dob={props.ask.dob}/>,
  weight: 3,
}, {
  name: 'ask-size',
  header: () => <button>Run</button>,
  render: (props) => <Size value={props.ask.size} type={'rtl'}/>,
  weight: 2,
}];

export default columns;
