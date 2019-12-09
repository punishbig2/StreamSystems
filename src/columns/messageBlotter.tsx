import {ColumnSpec} from 'components/Table/columnSpecification';
import {ExecTypes, Message} from 'interfaces/message';
import moment, {Moment} from 'moment';
import React from 'react';
import {currencyToNumber} from 'redux/actions/workareaActions';
import styled from 'styled-components';
import {tenorToNumber} from 'utils/dataGenerators';
import {priceFormatter} from 'utils/priceFormatter';

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
    console.log(data.ExecType);
    if (TransTypes[data.ExecType]) {
      return (<Normal>{TransTypes[data.ExecType]}</Normal>);
    } else {
      return (<Normal style={{color: 'crimson'}}>{data.ExecType}</Normal>);
    }
  },
  weight: 1,
  difference: (v1: Message, v2: Message): number => {
    return Number(v1.ExecType) - Number(v2.ExecType);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = TransTypes[v1.ExecType];
    if (!original)
      return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
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
  difference: (v1: Message, v2: Message): number => {
    const m1: Moment = moment(v1.TransactTime, INCOMING_DATE_FORMAT);
    const m2: Moment = moment(v2.TransactTime, INCOMING_DATE_FORMAT);
    return m1.diff(m2);
  },
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.TransactTime;
    if (!original)
      return false;
    const value: string = origin.toLowerCase();
    return value.includes(keyword);
  },
}, {
  name: 'Side',
  filterable: true,
  sortable: true,
  header: () => <div>Side</div>,
  render: ({Side}: Message) => (
    <Normal>{Side === '1' ? 'Buy' : 'Sell'}</Normal>
  ),
  weight: 1,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: string = v1.Side === '1' ? 'buy' : 'sell';
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return Number(v1) - Number(v2);
  },
}, {
  name: 'OrderQty',
  filterable: true,
  sortable: true,
  header: () => <div>Size</div>,
  render: ({OrderQty}: Message) => (
    <Normal>{OrderQty}</Normal>
  ),
  weight: 1,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.OrderQty);
    const numeric: number = Number(keyword);
    if (isNaN(numeric))
      return false;
    return value === numeric;
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.OrderQty) - Number(v2.OrderQty);
  },
}, {
  name: 'Symbol',
  filterable: true,
  sortable: true,
  header: () => <div>Currency</div>,
  render: ({Symbol}: Message) => (
    <Normal>{Symbol}</Normal>
  ),
  weight: 1,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Symbol;
    if (!original)
      return false;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    if (!v1.Symbol || !v2.Symbol)
      return 0;
    return currencyToNumber(v1.Symbol) - currencyToNumber(v2.Symbol);
  },
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
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Tenor;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message): number => {
    return tenorToNumber(v1.Tenor) - tenorToNumber(v2.Tenor);
  },
}, {
  name: 'Strategy',
  filterable: true,
  sortable: true,
  header: () => <div>Strategy</div>,
  render: ({Strategy}: Message) => (
    <Normal>{Strategy}</Normal>
  ),
  weight: 1,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const original: string = v1.Strategy;
    const value = original.toLowerCase();
    return value.includes(keyword);
  },
  difference: (v1: Message, v2: Message) => {
    const s1: string = v1.Strategy;
    return s1.localeCompare(v2.Strategy);
  },
}, {
  name: 'Price',
  filterable: true,
  sortable: true,
  header: () => <div>Level</div>,
  render: ({Price}: Message) => (
    <Normal>{priceFormatter(Number(Price))}</Normal>
  ),
  weight: 1,
  filterByKeyword: (v1: Message, keyword: string): boolean => {
    const value: number = Number(v1.Price);
    const numeric: number = Number(keyword);
    if (isNaN(numeric))
      return false;
    return priceFormatter(value) === priceFormatter(numeric);
  },
  difference: (v1: Message, v2: Message) => {
    return Number(v1.Price) - Number(v2.Price);
  },
}];

export default columns;
