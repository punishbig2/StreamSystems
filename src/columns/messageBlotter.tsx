import {ColumnSpec} from 'components/Table/columnSpecification';
import {ExecTypes, Message} from 'interfaces/message';
import moment, {Moment} from 'moment';
import React from 'react';
import {currencyToNumber} from 'redux/actions/workareaActions';
import {tenorToNumber} from 'utils/dataGenerators';
import {priceFormatter} from 'utils/priceFormatter';

// FIXME: make this configurable
const INCOMING_DATE_FORMAT: string = 'YYYYMMDD-hh:mm:ss', DISPLAY_DATE_FORMAT: string = 'MM-DD-YYYY hh:mm a',
  TransTypes: { [key: string]: string } = {
    [ExecTypes.New]: 'New',
    [ExecTypes.Canceled]: 'Cancel',
    [ExecTypes.Filled]: 'Filled',
    [ExecTypes.Replace]: 'Replace',
  }, columns: ColumnSpec[] = [{
    name: 'ExecTransType',
    header: () => <div>Type</div>,
    filterable: true,
    sortable: true,
    render: (data: Message) => {
      if (TransTypes[data.ExecType]) {
        return (<div className={'message-blotter-cell normal'}>{TransTypes[data.ExecType]}</div>);
      } else {
        return (<div className={'message-blotter-cell normal red'}>{data.ExecType}</div>);
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
        <div className={'message-blotter-cell time'}>
          {moment(data.TransactTime, INCOMING_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)}
        </div>
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
      <div className={'message-blotter-cell normal'}>{Side === '1' ? 'Buy' : 'Sell'}</div>
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
    name: 'Size',
    filterable: true,
    sortable: true,
    header: () => <div>Size</div>,
    render: (message: Message) => {
      switch (message.ExecType) {
        case ExecTypes.PartiallyFilled:
        case ExecTypes.Filled:
          return <div className={'message-blotter-cell normal'}>{message.LastShares}</div>;
        case ExecTypes.Canceled:
          return <div className={'message-blotter-cell normal'}>{message.LeavesQty}</div>;
        default:
          return <div className={'message-blotter-cell normal'}>{message.OrderQty}</div>;
      }
    },
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
      <div className={'message-blotter-cell normal'}>{Symbol}</div>
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
    name: 'Tenor',
    filterable: true,
    sortable: true,
    header: () => <div>Tenor</div>,
    render: ({Tenor}: Message) => (
      <div className={'message-blotter-cell normal'}>{Tenor}</div>
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
      <div className={'message-blotter-cell normal'}>{Strategy}</div>
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
      <div className={'message-blotter-cell normal'}>{priceFormatter(Number(Price))}</div>
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
  }, {
    name: 'CPTY',
    filterable: true,
    sortable: true,
    header: () => <div>CPTY</div>,
    render: (message: Message) => {
      const {ExecBroker, ExecType} = message;
      if ((ExecType !== ExecTypes.Filled) && (ExecType !== ExecTypes.PartiallyFilled))
        return <div/>;
      return (
        <div className={'message-blotter-cell normal'}>{ExecBroker}</div>
      );
    },
    weight: 1,
    filterByKeyword: ({ExecBroker}: Message, keyword: string): boolean => {
      return ExecBroker.includes(keyword);
    },
    difference: ({ExecBroker}: Message, v2: Message) => {
      return ExecBroker.localeCompare(v2.MDMkt);
    },
  }];

export default columns;
