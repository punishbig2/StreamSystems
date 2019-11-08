import {Button, Checkbox} from '@blueprintjs/core';
import runColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {Changes} from 'components/Run/enumerator';
import {RunHandlers} from 'components/Run/handlers';
import {Item} from 'components/Run/item';
import {Layout} from 'components/Run/layout';
import {reducer} from 'components/Run/reducer';
import {Table} from 'components/Table';
import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useEffect, useReducer} from 'react';
import {toRowId} from 'utils';
import {compareTenors, emptyBid, emptyOffer} from 'utils/dataGenerators';

interface Props {
  toggleOCO: () => void;
  symbol: string;
  strategy: string;
  oco: boolean;
  tenors: string[],
  user: User;
  onClose: () => void;
  onSubmit: (entries: TOBRow[]) => void;
  orders: { [id: string]: Order },
}

const Run: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, {table: null, history: []});
  const {symbol, strategy, tenors} = props;
  const onChange = () => {
    props.toggleOCO();
  };
  const handlers: RunHandlers = {
    onBidChanged: (tenor: string, value: number) => dispatch({type: Changes.Bid as string, data: {tenor, value}}),
    onOfferChanged: (tenor: string, value: number) => dispatch({type: Changes.Offer as string, data: {tenor, value}}),
    onMidChanged: (tenor: string, value: number) => dispatch({type: Changes.Mid as string, data: {tenor, value}}),
    onSpreadChanged: (tenor: string, value: number) => dispatch({type: Changes.Spread as string, data: {tenor, value}}),
    onOfferQtyChanged: (tenor: string, value: number) => dispatch({type: 'OfferQuantityChanged', data: {tenor, value}}),
    onBidQtyChanged: (tenor: string, value: number) => dispatch({type: 'BidQuantityChanged', data: {tenor, value}}),
  };
  useEffect(() => {
    const rows: TOBRow[] = tenors
      .map((tenor: string) => {
        return {
          id: toRowId(tenor, symbol, strategy),
          tenor: tenor,
          bid: emptyBid(tenor, symbol, strategy, ''),
          offer: emptyOffer(tenor, symbol, strategy, ''),
          mid: null,
          spread: null,
        };
      });
    const table = rows
      .sort(compareTenors)
      .reduce((table: TOBTable, row: TOBRow) => {
        table[row.tenor] = row;
        return table;
      }, {});
    dispatch({type: 'SET_TABLE', data: table});
  }, [symbol, strategy, tenors]);
  console.log('rendering run window');
  const onSubmit = () => {
    if (state.table === null)
      return;
    const entries = Object.values(state.table)
      .filter(({bid, offer}) => {
        return bid.price !== null && offer.price !== null;
      });
    if (entries.length === 0)
      return;
    props.onSubmit(entries);
  };
  if (state.table === null)
    return (<div>Loading...</div>);
  return (
    <Layout>
      <div className={'window-title-bar'}>
        <Item>{props.symbol}</Item>
        <Item>{props.strategy}</Item>
        <Item>
          <Checkbox checked={props.oco} onChange={onChange} label={'OCO'} style={{display: 'none'}} inline/>
        </Item>
      </div>
      <Table<RunHandlers> columns={runColumns} rows={state.table || {}} handlers={handlers} user={props.user}/>
      <DialogButtons>
        <Button text={strings.Submit} intent={'primary'} onClick={onSubmit}/>
        <Button text={strings.Close} intent={'none'} onClick={props.onClose}/>
      </DialogButtons>
    </Layout>
  );
};

export {Run};
