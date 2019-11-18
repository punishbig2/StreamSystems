import {ColumnSpec} from 'components/Table/columnSpecification';
import {ExecTypes, Message} from 'interfaces/message';
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

const TransTypes: { [key: string]: string } = {
  [ExecTypes.New]: 'New',
  [ExecTypes.Canceled]: 'Cancel',
  [ExecTypes.Filled]: 'Filled',
  [ExecTypes.Replace]: 'Replace',
};

const columns: ColumnSpec[] = [{
  name: 'ExecTransType',
  header: () => <div>Type</div>,
  filterable: true,
  sortable: true,
  render: (data: Message) => {
    if (TransTypes[data.ExecType]) {
      return (<Normal>{TransTypes[data.ExecType]}</Normal>);
    } else {
      return (<Normal style={{color: 'crimson'}}>{data.ExecType}</Normal>);
    }
  },
  weight: 1,
}, {
  name: 'TransactTime',
  header: () => <div>Time (EST)</div>,
  filterable: true,
  sortable: true,
  render: (data: Message) => {
    return (
      <Time>{moment(data.TransactTime, INCOMING_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)}</Time>
    );
  },
  weight: 2,
}, {
  name: 'Side',
  filterable: true,
  sortable: true,
  header: () => <div>Side</div>,
  render: ({Side}: Message) => (
    <Normal>{Side === '1' ? 'Buy' : 'Sell'}</Normal>
  ),
  weight: 1,
}, {
  name: 'OrderQty',
  filterable: true,
  sortable: true,
  header: () => <div>Qty.</div>,
  render: ({OrderQty}: Message) => (
    <Normal>{OrderQty}</Normal>
  ),
  weight: 1,
}, {
  name: 'Symbol',
  filterable: true,
  sortable: true,
  header: () => <div>Currency</div>,
  render: ({Symbol}: Message) => (
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
  name: 'Tenor',
  filterable: true,
  sortable: true,
  header: () => <div>Tenor</div>,
  render: ({Tenor}: Message) => (
    <Normal>{Tenor}</Normal>
  ),
  weight: 1,
}, {
  name: 'Strategy',
  filterable: true,
  sortable: true,
  header: () => <div>Strategy</div>,
  render: ({Strategy}: Message) => (
    <Normal>{Strategy}</Normal>
  ),
  weight: 1,
}, {
  name: 'Price',
  filterable: true,
  sortable: true,
  header: () => <div>Level</div>,
  render: ({Price}: Message) => (
    <Normal>{Price}</Normal>
  ),
  weight: 1,
}];

export default columns;
