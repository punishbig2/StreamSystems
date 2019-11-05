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
  render: ({tenor, handlers, bid}: RowType) => (
    <Price editable={true} value={bid.price} onChange={(price: number) => handlers.onBidChanged(tenor, price)} black/>
  ),
  weight: 4,
}, {
  name: 'bid-quantity',
  header: () => <div/>,
  render: () => <TableInput className={'normal'} value={'10'} aligned={'center'}/>,
  weight: 3,
}, {
  name: 'offer-price',
  header: () => <div>{strings.Offer}</div>,
  render: ({tenor, offer, handlers}: RowType) => (
    <Price editable={true} value={offer.price} onChange={(price: number) => handlers.onOfferChanged(tenor, price)} black/>
  ),
  weight: 4,
}, {
  name: 'offer-quantity',
  header: () => <div/>,
  render: () => <TableInput className={'normal'} value={'10'} aligned={'center'}/>,
  weight: 3,
}, {
  name: 'mid',
  header: () => <div>{strings.Mid}</div>,
  render: ({tenor, handlers, mid}: RowType) => (
    <Price editable={true} value={mid} onChange={(value: number) => handlers.onMidChanged(tenor, value)} black/>
  ),
  weight: 4,
}, {
  name: 'spread',
  header: () => <div>{strings.Spread}</div>,
  render: ({tenor, handlers, spread}: RowType) => {
    return (
      <Price editable={true} value={spread} onChange={(value: number) => handlers.onSpreadChanged(tenor, value)} black/>
    );
  },
  weight: 4,
}];

export default columns;
