import {ColumnSpec} from 'components/Table/columnSpecification';
import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {Sides} from 'interfaces/order';
import React from 'react';

const columns: ColumnSpec[] = [{
  name: 'time',
  header: () => <div>Time (EST)</div>,
  render: (data: MessageBlotterEntry) => {
    console.log(data);
    return (
      <div>{data.TransactTime}</div>
    )
  },
  weight: 1,
}, {
  name: 'side',
  header: () => <div>Side</div>,
  render: ({Side}: MessageBlotterEntry) => (
    <div>{Side === Sides.Buy ? 'Buy' : 'Sell'}</div>
  ),
  weight: 1,
}, {
  name: 'quantity',
  header: () => <div>Qty.</div>,
  render: ({OrderQty}: MessageBlotterEntry) => (
    <div>{OrderQty}</div>
  ),
  weight: 1,
}, {
  name: 'currency',
  header: () => <div>Currency</div>,
  render: ({Currency}: MessageBlotterEntry) => (
    <div>{Currency}</div>
  ),
  weight: 1,
}, {
  name: 'spot',
  header: () => <div>Spot</div>,
  render: ({AvgPx}: MessageBlotterEntry) => (
    <div>{AvgPx}</div>
  ),
  weight: 1,
}, {
  name: 'tenor',
  header: () => <div>Tenor</div>,
  render: () => (
    <div/>
  ),
  weight: 1,
}, {
  name: 'strategy',
  header: () => <div>Strategy</div>,
  render: () => (
    <div/>
  ),
  weight: 1,
}, {
  name: 'level',
  header: () => <div>Level</div>,
  render: () => (
    <div/>
  ),
  weight: 1,
}, {
  name: 'buyer',
  header: () => <div>Buyer</div>,
  render: () => (
    <div/>
  ),
  weight: 1,
}, {
  name: 'seller',
  header: () => <div>Seller</div>,
  render: () => (
    <div/>
  ),
  weight: 1,
}];

export default columns;
