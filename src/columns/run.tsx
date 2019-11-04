import {RunHandlers} from 'components/Run/handlers';
import {Price} from 'components/Table/CellRenderers/Price';
import {Tenor} from 'components/Table/CellRenderers/Tenor';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TableInput} from 'components/TableInput';
import {TOBRow} from 'interfaces/tobRow';
import React from 'react';
import strings from 'locales';

type RowType = TOBRow & { handlers: RunHandlers };
const columns: ColumnSpec[] = [{
  name: 'tenor',
  header: () => <div/>,
  render: ({tenor}: RowType) => (
    <Tenor tenor={tenor} onTenorSelected={() => null}/>
  ),
  weight: 2,
}, {
  name: 'bid-price',
  header: () => <div>{strings.Bid}</div>,
  render: ({bid: entry, tenor, handlers}: RowType) => (
    <TableInput className={'normal'}
                onChange={(price: string) => handlers.onBidChanged(tenor, Number(price))}/>
  ),
  weight: 4,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: () => <TableInput className={'normal'} defaultValue={'10'} align={'center'}/>,
  weight: 3,
}, {
  name: 'offer-price',
  header: () => <div>{strings.Offer}</div>,
  render: ({offer: entry, tenor, handlers}: RowType) => (
    <TableInput className={'normal'}
                onChange={(price: string) => handlers.onOfferChanged(tenor, Number(price))}/>
  ),
  weight: 4,
}, {
  name: 'offer-quantity',
  header: () => <div/>,
  render: () => <TableInput className={'normal'} defaultValue={'10'} align={'center'}/>,
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({tenor, handlers, mid}: RowType) => (
    <Price owned={true}
           onChange={(value: number) => handlers.onMidChanged(tenor, value)} value={mid ? mid : null}/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({tenor, handlers, spread}: RowType) => {
    return (
      <Price owned={true} value={spread ? spread : null}
             onChange={(value: number) => handlers.onSpreadChanged(tenor, value)}/>
    );
  },
  weight: 4,
}];

export default columns;
