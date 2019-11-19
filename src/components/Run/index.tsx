import createColumns from 'columns/run';
import {DialogButtons} from 'components/PullRight';
import {RunActions} from 'components/Run/enumerator';
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
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {TOBActions} from 'redux/constants/tobConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {RunState} from 'redux/stateDefs/runState';
import {toRunId} from 'utils';
import {compareTenors, emptyEntry} from 'utils/dataGenerators';
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

const useInitializer = (tenors: string[], symbol: string, strategy: string, email: string, orders: any[], onReady: (table: any) => void) => {
  useEffect(() => {
    const rows: TOBRow[] = tenors
      .map((tenor: string) => {
        const getEntry = (type: EntryTypes) => {
          const empty: TOBEntry = emptyEntry(tenor, symbol, strategy, email, 10, type);
          if (orders) {
            const entry = orders.find((order) => {
              return matchOrder(order, symbol, strategy, tenor, type);
            });
            return entry || empty;
          } else {
            return empty;
          }
        };
        const bid: TOBEntry = getEntry(EntryTypes.Bid);
        const offer: TOBEntry = getEntry(EntryTypes.Offer);
        return {
          id: $$(toRunId(symbol, strategy), tenor),
          tenor: tenor,
          bid: bid,
          offer: offer,
          mid: bid.price !== null && offer.price !== null ? (Number(bid.price) + Number(offer.price)) / 2 : null,
          spread: bid.price !== null && offer.price !== null ? Number(offer.price) - Number(bid.price) : null,
        };
      });
    const table = rows
      .sort(compareTenors)
      .reduce((table: TOBTable, row: TOBRow) => {
        table[row.id] = row;
        return table;
      }, {});
    onReady(table);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, orders, email]);
};

const useOrderListener = (tenors: string[], symbol: string, strategy: string, update: (entry: TOBEntry) => void) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const customEvent: CustomEvent<TOBEntry> = event as CustomEvent<TOBEntry>;
      update(customEvent.detail);
    };
    const cleaners: (() => void)[] = tenors.map((tenor) => {
      const name: string = $$(tenor, symbol, strategy, TOBActions.UpdateOrders);
      document.addEventListener(name, listener);
      return () => {
        document.removeEventListener(name, listener);
      };
    });
    return () => cleaners.forEach((fn) => fn());
  }, [tenors, symbol, strategy, update]);
};

const Run: React.FC<OwnProps> = withRedux((props: OwnProps & RunState) => {
  const [state, dispatch] = useReducer(reducer, {table: {}, history: []});
  const {symbol, strategy, tenors, orders, user} = props;
  const {email} = user;

  const setTable = (table: TOBTable) => dispatch(createAction(RunActions.SetTable, table));
  // Updates a single side of the depth
  const updateSide = (entry: TOBEntry) => {
    const id: string = $$(toRunId(entry.symbol, entry.strategy), entry.tenor);
    switch (entry.type) {
      case EntryTypes.Invalid:
        break;
      case EntryTypes.Offer:
        dispatch(createAction(RunActions.UpdateOffer, {id, entry}));
        break;
      case EntryTypes.Bid:
        dispatch(createAction(RunActions.UpdateBid, {id, entry}));
        break;
      case EntryTypes.DarkPool:
        break;
    }
  };

  // Use hooks
  useOrderListener(tenors, symbol, strategy, updateSide);
  useInitializer(tenors, symbol, strategy, email, orders, setTable);

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

  if (state.table === {})
    return (<div>Loading...</div>);

  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props} user={props.user} row={row} defaultBidQty={10} defaultOfrQty={10}/>
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: (id: string, value: string) => dispatch(createAction(RunActions.Bid, {id, value})),
    onOfferChanged: (id: string, value: string) => dispatch(createAction(RunActions.Offer, {id, value})),
    onMidChanged: (id: string, value: string) => dispatch(createAction(RunActions.Mid, {id, value})),
    onSpreadChanged: (id: string, value: string) => dispatch(createAction(RunActions.Spread, {id, value})),
    onOfferQtyChanged: (id: string, value: string) => dispatch(createAction(RunActions.OfferQtyChanged, {id, value})),
    onBidQtyChanged: (id: string, value: string) => dispatch(createAction(RunActions.BidQtyChanged, {id, value})),
  });

  return (
    <div className={'run-window'}>
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
