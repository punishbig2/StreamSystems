import {Button, Checkbox} from '@blueprintjs/core';
import runColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {Changes} from 'components/Run/enumerator';
import {RunHandlers} from 'components/Run/handlers';
import {Item} from 'components/Run/item';
import {Layout} from 'components/Run/layout';
import {reducer} from 'components/Run/reducer';
import {Table} from 'components/Table';
import {TitleBar} from 'components/TileTitleBar';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {useReducer} from 'react';

interface Props {
  toggleOCO: () => void;
  symbol: string;
  strategy: string;
  oco: boolean;
  table: TOBTable;
  user: User;
  onClose: () => void;
  onSubmit: (entries: TOBRow[]) => void;
}

const Run: React.FC<Props> = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, {table: props.table, history: []});
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
    const entries = Object.values(state.table)
      .filter(({bid}) => bid.price !== null);
    if (entries.length === 0)
      return;
    props.onSubmit(entries);
  };
  return (
    <Layout>
      <TitleBar>
        <Item>{props.symbol}</Item>
        <Item>{props.strategy}</Item>
        <Item>
          <Checkbox checked={props.oco} onChange={onChange} label={'OCO'} style={{display: 'none'}} inline/>
        </Item>
      </TitleBar>
      <Table<RunHandlers> columns={runColumns} rows={state.table} handlers={handlers} user={props.user} prefix={'run'}/>
      <DialogButtons>
        <Button text={strings.Submit} intent={'primary'} onClick={onSubmit}/>
        <Button text={strings.Close} intent={'none'} onClick={props.onClose}/>
      </DialogButtons>
    </Layout>
  );
};

export {Run};
