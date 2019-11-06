import {Button, Checkbox} from '@blueprintjs/core';
import {API} from 'API';
import runColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {Changes} from 'components/Run/enumerator';
import {RunHandlers} from 'components/Run/handlers';
import {Item} from 'components/Run/item';
import {Layout} from 'components/Run/layout';
import {reducer} from 'components/Run/reducer';
import {Table} from 'components/Table';
import {TitleBar} from 'components/TileTitleBar';
import {Order} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useEffect, useReducer} from 'react';
import {compareTenors, emptyBid, emptyOffer} from 'utils/dataGenerators';
import {toTOBRow} from 'utils/dataParser';

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
  };
  useEffect(() => {
    const promises: Promise<TOBRow>[] = tenors
      .map(async (tenor: string) => {
        const entry = await API.getSnapshot(symbol, strategy, tenor);
        if (entry) {
          return toTOBRow(entry);
        } else {
          return {
            id: tenor,
            tenor: tenor,
            bid: emptyBid(tenor, symbol, strategy, ''),
            offer: emptyOffer(tenor, symbol, strategy, ''),
            mid: null,
            spread: null,
          };
        }
      });
    Promise.all(promises)
      .then((rows: TOBRow[]) => {
        const table = rows
          .sort(compareTenors)
          .reduce((table: TOBTable, row: TOBRow) => {
            table[row.tenor] = row;
            return table;
          }, {});
        dispatch({type: 'SET_TABLE', data: table});
      });
  }, [symbol, strategy, tenors]);
  const onSubmit = () => {
    if (state.table === null)
      return;
    console.log(Object.values(state.table));
    const entries = Object.values(state.table)
      .filter(({bid, offer}) => {
        return bid.price !== null && offer.price !== null;
      });
    console.log(entries);
    if (entries.length === 0)
      return;
    props.onSubmit(entries);
  };
  if (state.table === null)
    return (<div>Loading...</div>);
  return (
    <Layout>
      <TitleBar>
        <Item>{props.symbol}</Item>
        <Item>{props.strategy}</Item>
        <Item>
          <Checkbox checked={props.oco} onChange={onChange} label={'OCO'} style={{display: 'none'}} inline/>
        </Item>
      </TitleBar>
      <Table<RunHandlers> columns={runColumns} rows={state.table || {}} handlers={handlers} user={props.user}
                          prefix={'run'}/>
      <DialogButtons>
        <Button text={strings.Submit} intent={'primary'} onClick={onSubmit}/>
        <Button text={strings.Close} intent={'none'} onClick={props.onClose}/>
      </DialogButtons>
    </Layout>
  );
};

export {Run};
