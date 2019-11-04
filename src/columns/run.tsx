import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TableInput} from 'components/TableInput';
import React from 'react';
import strings from 'locales';

const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor, handlers}: { tenor: string, handlers: any }) => (
    <Tenor tenor={tenor} onTenorSelected={handlers.onTenorSelected}/>
  ),
  weight: 2,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: () => <TableInput className={'normal'}/>,
  weight: 4,
}, {
  name: 'bid-size',
  header: () => <div/>,
  render: () => <TableInput className={'normal'} defaultValue={'10'} align={'center'}/>,
  weight: 3,
}, {
  name: 'offer-price',
  header: () => <div>{strings.Offer}</div>,
  render: () => <TableInput className={'normal'}/>,
  weight: 4,
}, {
  name: 'offer-size',
  header: () => <div/>,
  render: () => <TableInput className={'normal'} defaultValue={'10'} align={'center'}/>,
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: () => <TableInput className={'normal'}/>,
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: () => <TableInput className={'normal'}/>,
  weight: 4,
}];

export default columns;
