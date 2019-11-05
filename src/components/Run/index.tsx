import {Button, Checkbox} from '@blueprintjs/core';
import runColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {Changes} from 'components/Run/enumerator';
import {RunHandlers} from 'components/Run/handlers';
import {Item} from 'components/Run/item';
import {Layout} from 'components/Run/layout';
import {Table} from 'components/Table';
import {TitleBar} from 'components/TileTitleBar';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useReducer} from 'react';
import {Action} from 'redux/action';
import {functionMap} from 'components/Run/fucntionMap';

interface Props {
  toggleOCO: () => void;
  symbol: string;
  product: string;
  oco: boolean;
  rows: TOBTable;
  user: User;
  onClose: () => void;
  onSubmit: (entries: TOBRow[]) => void;
}

interface State {
  history: Changes[];
  rows: TOBTable;
}

interface Computed {
  spread: number | null;
  mid: number | null;
  offer: number | null;
  bid: number | null;
}

type Calculator = (v1: number, v2: number) => number;
const computeRow = (type: Changes, last: Changes | undefined, data: Computed, v1: number): Computed => {
  if (!last)
    return data;
  // Get the last edited value
  const v2: number = data[last] as number;
  if (type === last)
    return data;
  const findCalculator = (k1: string, k2: string, k3: string): Calculator => {
    if (k1 === k2) {
      return () => v1;
    } else if (k1 === k3) {
      return () => v2;
    } else {
      return functionMap[k1][k2][k3];
    }
  };
  return {
    spread: findCalculator(Changes.Spread, type, last)(v1, v2),
    mid: findCalculator(Changes.Mid, type, last)(v1, v2),
    offer: findCalculator(Changes.Offer, type, last)(v1, v2),
    bid: findCalculator(Changes.Bid, type, last)(v1, v2),
  };
};

const reducer = (state: State, {type, data}: Action<Changes>): State => {
  const {history, rows} = state;
  const findRow = (tenor: string): TOBRow | null => {
    const key: string | undefined = Object.keys(state.rows)
      .find((key) => key.startsWith(tenor))
    ;
    if (key === undefined)
      return null;
    return {...state.rows[key]};
  };
  const row: TOBRow | null = findRow(data.tenor);
  if (!row)
    return state;
  const {bid, offer} = row;
  // Original values
  const seed: Computed = {
    spread: row.spread,
    mid: row.mid,
    offer: offer.price,
    bid: bid.price,
    // Overwrite the one that will be replaced
    [type]: data.value,
  };
  const updateHistory = (newItem: Changes, original: Changes[]): Changes[] => {
    if (original.length === 0)
      return [newItem];
    if (original[0] === newItem)
      return [...original];
    return [type, ...original].slice(0, 2);
  };
  const last: Changes | undefined = history.length > 0 ? (history[0] === type ? history[1] : history[0]) : undefined;
  const computed: Computed = computeRow(type, last, seed, data.value);
  switch (type) {
    case Changes.Mid:
    case Changes.Spread:
    case Changes.Offer:
    case Changes.Bid:
      return {
        ...state,
        rows: {
          ...rows,
          [row.id]: {
            ...row,
            spread: computed.spread,
            mid: computed.mid,
            offer: {...row.offer, price: computed.offer},
            bid: {...row.bid, price: computed.bid},
          },
        },
        history: updateHistory(type, history),
      };
    default:
      return state;
  }
};

const Run: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, {rows: props.rows, history: []});
  const onChange = () => {
    props.toggleOCO();
  };
  const handlers: RunHandlers = {
    onBidChanged: (tenor: string, value: number) => dispatch({type: Changes.Bid, data: {tenor, value}}),
    onOfferChanged: (tenor: string, value: number) => dispatch({type: Changes.Offer, data: {tenor, value}}),
    onMidChanged: (tenor: string, value: number) => dispatch({type: Changes.Mid, data: {tenor, value}}),
    onSpreadChanged: (tenor: string, value: number) => dispatch({type: Changes.Spread, data: {tenor, value}}),
  };
  const onSubmit = () => {
    const entries = Object.values(state.rows)
      .filter(({bid}) => bid.price !== null);
    if (entries.length === 0)
      return;
    props.onSubmit(entries);
  };
  return (
    <Layout>
      <TitleBar>
        <Item>{props.symbol}</Item>
        <Item>{props.product}</Item>
        <Item>
          <Checkbox checked={props.oco} onChange={onChange} label={'OCO'} inline/>
        </Item>
      </TitleBar>
      <Table<RunHandlers> columns={runColumns} rows={state.rows} handlers={handlers} user={props.user} prefix={'run'}/>
      <DialogButtons>
        <Button text={strings.Submit} intent={'primary'} onClick={onSubmit}/>
        <Button text={strings.Close} intent={'none'} onClick={props.onClose}/>
      </DialogButtons>
    </Layout>
  );
};

export {Run};
