import {ColumnSpec} from 'components/Table/columnSpecification';
import {MessageBlotterEntry} from 'interfaces/messageBlotterEntry';
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

const INCOMING_DATE_FORMAT: string = 'YYYYMMDD-hh:mm:ss';
// FIXME: make this configurable
const DISPLAY_DATE_FORMAT: string = 'MM-DD-YYYY hh:mm a';

const columns: ColumnSpec[] = [{
  name: 'time',
  header: () => <div>Time (EST)</div>,
  filterable: true,
  sortable: true,
  render: (data: MessageBlotterEntry) => {
    console.log(data);
    return (
      <Time>{moment(data.TransactTime, INCOMING_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)}</Time>
    );
  },
  weight: 2,
}, {
  name: 'side',
  filterable: true,
  sortable: true,
  header: () => <div>Side</div>,
  render: ({Side}: MessageBlotterEntry) => (
    <Normal>{Side === '1' ? 'Buy' : 'Sell'}</Normal>
  ),
  weight: 1,
}, {
  name: 'quantity',
  filterable: true,
  sortable: true,
  header: () => <div>Qty.</div>,
  render: ({OrderQty}: MessageBlotterEntry) => (
    <Normal>{OrderQty}</Normal>
  ),
  weight: 1,
}, {
  name: 'currency',
  filterable: true,
  sortable: true,
  header: () => <div>Currency</div>,
  render: ({Symbol}: MessageBlotterEntry) => (
    <Normal>{Symbol}</Normal>
  ),
  weight: 1,
}, {
  name: 'spot',
  filterable: true,
  sortable: true,
  header: () => <div>Spot</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'tenor',
  filterable: true,
  sortable: true,
  header: () => <div>Tenor</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'strategy',
  filterable: true,
  sortable: true,
  header: () => <div>Strategy</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'level',
  filterable: true,
  sortable: true,
  header: () => <div>Level</div>,
  render: ({Price}: MessageBlotterEntry) => (
    <Normal>{Price}</Normal>
  ),
  weight: 1,
}, {
  name: 'buyer',
  filterable: true,
  sortable: true,
  header: () => <div>Buyer</div>,
  render: () => (
    <Normal/>
  ),
  weight: 1,
}, {
  name: 'seller',
  filterable: true,
  sortable: true,
  header: () => 'Seller',
  render: () => (
    <Normal/>
  ),
  weight: 1,
}];

export default columns;
