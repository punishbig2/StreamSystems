import createColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {Changes} from 'components/Run/enumerator';
import {reducer} from 'components/Run/reducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {ReactElement, useEffect, useReducer} from 'react';
import {connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {createRunReducer} from 'redux/reducers/runReducer';
import {RunState} from 'redux/stateDefs/runState';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {toRunId} from 'utils';
import {compareTenors, emptyBid} from 'utils/dataGenerators';
import {$$} from 'utils/stringPaster';

interface DispatchProps {
}

interface OwnProps {
  id: string;
  toggleOCO: () => void;
  symbol: string;
  strategy: string;
  oco: boolean;
  tenors: string[],
  user: User;
  onClose: () => void;
  onSubmit: (entries: TOBRow[]) => void;
}

const mapDispatchToProps: DispatchProps = {};
const withRedux = connect(
  dynamicStateMapper<RunState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

const matchOrder = (order: TOBEntry, symbol: string, strategy: string, tenor: string, type: EntryTypes): boolean => {
  return order.tenor === tenor && order.symbol === symbol && order.strategy === strategy && order.type === type;
};

const Run: React.FC<OwnProps> = withRedux((props: OwnProps & RunState) => {
  const [state, dispatch] = useReducer(reducer, {table: null, history: []});
  const {id, symbol, strategy, tenors, orders} = props;
  useEffect(() => {
    const rows: TOBRow[] = tenors
      .map((tenor: string) => {
        const getEntry = (type: EntryTypes) => {
          const empty: TOBEntry = emptyBid(tenor, symbol, strategy, '', 10);
          if (orders) {
            const entry = orders.find((order) => {
              return matchOrder(order, symbol, strategy, tenor, type);
            });
            return entry || empty;
          } else {
            return empty;
          }
        };
        return {
          id: $$(toRunId(symbol, strategy), tenor),
          tenor: tenor,
          bid: getEntry(EntryTypes.Bid),
          offer: getEntry(EntryTypes.Ask),
          mid: null,
          spread: null,
        };
      });
    const table = rows
      .sort(compareTenors)
      .reduce((table: TOBTable, row: TOBRow) => {
        table[row.id] = row;
        return table;
      }, {});
    dispatch({type: 'SET_TABLE', data: table});
  }, [symbol, strategy, tenors, orders]);
  useEffect(() => {
    injectNamedReducer(id, createRunReducer, {orders: []});
    return () => {
      removeNamedReducer(id);
    };
  }, [id]);
  const onSubmit = () => {
    if (state.table === null)
      return;
    const entries = Object.values(state.table)
      .filter((entry) => entry.modified)
      .filter(({bid, offer}) => {
        return bid.price !== null || offer.price !== null;
      });
    if (entries.length === 0)
      return;
    props.onSubmit(entries);
  };
  if (state.table === null)
    return (<div>Loading...</div>);
  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props} user={props.user} row={row} fixedRow={row.modified ? row : undefined}/>
    );
  };
  const columns = createColumns({
    onBidChanged: (id: string, value: number) => dispatch({type: Changes.Bid as string, data: {id, value}}),
    onOfferChanged: (id: string, value: number) => dispatch({type: Changes.Offer as string, data: {id, value}}),
    onMidChanged: (id: string, value: number) => dispatch({type: Changes.Mid as string, data: {id, value}}),
    onSpreadChanged: (id: string, value: number) => dispatch({type: Changes.Spread as string, data: {id, value}}),
    onOfferQtyChanged: (id: string, value: number) => dispatch({type: 'OfferQuantityChanged', data: {id, value}}),
    onBidQtyChanged: (id: string, value: number) => dispatch({type: 'BidQuantityChanged', data: {id, value}}),
  });
  return (
    <div>
      <div className={'modal-title-bar'}>
        <div className={'half'}>
          <div className={'item'}>{props.symbol}</div>
          <div className={'item'}>{props.strategy}</div>
        </div>
        <div className={'half'}>
          <label>
            <input type={'checkbox'} checked={props.oco} onChange={props.toggleOCO}/><span>OCO</span>
          </label>
        </div>
      </div>
      <Table columns={columns} rows={state.table} renderRow={renderRow}/>
      <DialogButtons>
        <button type={'submit'} onClick={onSubmit}>{strings.Submit}</button>
        <button onClick={props.onClose}>{strings.Close}</button>
      </DialogButtons>
    </div>
  );
});

export {Run};
