import {ColumnSpec} from 'components/Table/columnSpecification';
import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
import {Sides} from 'interfaces/order';
import React from 'react';
import styled from 'styled-components';
import moment from 'moment';

const Normal = styled.div`
  text-align: center;
  font-weight: 600;
`;
const Time = styled.div`
  text-align: center;
  font-weight: 600;
`;
// 20191106-13:24:41

const columns: ColumnSpec[] = [{
  name: 'time',
  header: () => <div>Time (EST)</div>,
  render: (data: MessageBlotterEntry) => {
    console.log(data);
    return (
      <Time>{moment(data.TransactTime, 'YYYYMMDD-hh:mm:ss').format('MM-DD-YYYY HH:mm P')}</Time>
    )
  },
  weight: 2,
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
    <Normal>{OrderQty}</Normal>
  ),
  weight: 1,
}, {
  name: 'currency',
  header: () => <div>Currency</div>,
  render: ({Currency}: MessageBlotterEntry) => (
    <Normal>{Currency}</Normal>
  ),
  weight: 1,
}, {
  name: 'spot',
  header: () => <div>Spot</div>,
  render: ({AvgPx}: MessageBlotterEntry) => (
    <Normal>{AvgPx}</Normal>
  ),
  weight: 1,
}, {
  name: 'tenor',
  header: () => <div>Tenor</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'strategy',
  header: () => <div>Strategy</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'level',
  header: () => <div>Level</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'buyer',
  header: () => <div>Buyer</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'seller',
  header: () => <div>Seller</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}];

export default columns;
