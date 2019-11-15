import columns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {TOBHandlers} from 'components/TOB/handlers';
import {Row} from 'components/TOB/row';
import {TOBTileTitle} from 'components/TOB/title';
import {TenorType} from 'interfaces/md';
import {EntryTypes} from 'interfaces/mdEntry';
import {Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {cancelAll, cancelOrder, createOrder, getSnapshot, updateOrder} from 'redux/actions/tobActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tobConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {SignalRAction} from 'redux/signalRAction';
import {RunState} from 'redux/stateDefs/runState';
import {WindowState} from 'redux/stateDefs/windowState';
import {toRowId, toRunId} from 'utils';
import {compareTenors, emptyBid, emptyOffer} from 'utils/dataGenerators';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  tenors: string[],
  products: Strategy[];
  symbols: string[];
  user: User;
  onClose?: () => void;
}

export const subscribe = (symbol: string, strategy: string, tenor: string): SignalRAction<TileActions> => {
  return new SignalRAction(SignalRActions.SubscribeForMarketData, [symbol, strategy, tenor]);
};

interface DispatchProps {
  subscribe: (symbol: string, strategy: string, tenor: string) => void;
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void;
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  setStrategy: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (entry: TOBEntry) => void;
  cancelOrder: (entry: TOBEntry) => void;
  cancelAll: (symbol: string, strategy: string, side: Sides) => void;
  updateOrder: (entry: TOBEntry) => void;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TileActions.Initialize), rows)),
  subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
  setStrategy: (value: string) => dispatch(createAction($$(id, TileActions.SetStrategy), value)),
  createOrder: (order: TOBEntry) => dispatch(createOrder(id, order)),
  setSymbol: (value: string) => dispatch(createAction($$(id, TileActions.SetSymbol), value)),
  toggleOCO: () => dispatch(createAction($$(id, TileActions.ToggleOCO))),
  cancelOrder: (entry: TOBEntry) => dispatch(cancelOrder(id, entry)),
  getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(id, symbol, strategy, tenor)),
  cancelAll: (symbol: string, strategy: string, side: Sides) => dispatch(cancelAll(id, symbol, strategy, side)),
  updateOrder: (entry: TOBEntry) => dispatch(updateOrder(id, entry)),
});

const nextSlice = (applicationState: ApplicationState, props: OwnProps): WindowState & RunState => {
  const generic: { [key: string]: any } = applicationState;
  if (generic.hasOwnProperty(props.id)) {
    const localState: WindowState = generic[props.id];
    return {...localState, ...generic[toRunId(localState.symbol, localState.strategy)]};
  }
  return {} as WindowState & RunState;
};

const withRedux: (ignored: any) => any = connect<WindowState & RunState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<WindowState & RunState, OwnProps, ApplicationState>(nextSlice),
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WindowState & RunState;

const buildRows = (tenors: string[], symbol: string, strategy: string, email: string): TOBRow[] => {
  return tenors.map((tenor: TenorType) => {
    // This is here because javascript is super stupid and `connected' can change
    // while we're subscribing combinations.
    //
    // Ideally, we should implement the ability to stop
    const row: TOBRow = {
      tenor: tenor,
      id: toRowId(tenor, symbol, strategy),
      bid: emptyBid(tenor, symbol, strategy, email),
      darkPool: '',
      offer: emptyOffer(tenor, symbol, strategy, email),
      dob: undefined,
      mid: null,
      spread: null,
    };
    // Return row
    return row;
  }).sort(compareTenors);
};

export const TOB: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const {symbols, symbol, products, strategy, tenors, connected, subscribe, getSnapshot, initialize, rows} = props;
  const {email} = props.user;
  // Internal stuff
  const [orderTicket, setOrderTicket] = useState<TOBEntry | null>(null);
  const [runWindowVisible, setRunWindowVisible] = useState<boolean>(false);
  const [currentTenor, setCurrentTenor] = useState<{ tenor: string, table: TOBTable } | null>(null);
  // Extract properties to manage them better
  const setProduct = ({target: {value}}: { target: HTMLSelectElement }) => props.setStrategy(value);
  const setSymbol = ({target: {value}}: { target: HTMLSelectElement }) => props.setSymbol(value);
  useEffect(() => {
    if (!symbol || !strategy || symbol === '' || strategy === '')
      return;
    const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
      object[item.id] = item;
      // Return the accumulator
      return object;
    };
    const rows: TOBRow[] = buildRows(tenors, symbol, strategy, email);
    // For each row, get a snapshot
    rows.forEach(({tenor}: TOBRow) => getSnapshot(symbol, strategy, tenor));
    // Initialize with base table
    initialize(rows.reduce(reducer, {}));
  }, [symbol, strategy, tenors, getSnapshot, initialize, email]);
  useEffect(() => {
    if (!rows || !connected)
      return;
    const array: TOBRow[] = Object.values(rows);
    if (connected) {
      // Subscribe to symbol/strategy/tenor combination
      array.forEach(({tenor}: TOBRow) => subscribe(symbol, strategy, tenor));
    }
  }, [connected, rows, strategy, subscribe, symbol]);
  const handlers: TOBHandlers = {
    onUpdateOrder: (entry: TOBEntry) => {
      props.updateOrder(entry);
    },
    onTenorSelected: (tenor: string, table: TOBTable) => {
      if (currentTenor === null) {
        setCurrentTenor({tenor, table});
      } else {
        setCurrentTenor(null);
      }
    },
    onDoubleClick: (type: EntryTypes, entry: TOBEntry) => {
      if (entry.type === EntryTypes.Offer) {
        setOrderTicket(entry);
      } else {
        setOrderTicket(entry);
      }
    },
    onRunButtonClicked: () => {
      setRunWindowVisible(true);
    },
    onRefBidsButtonClicked: () => {
      props.cancelAll(symbol, strategy, Sides.Buy);
    },
    onRefOffersButtonClicked: () => {
      props.cancelAll(symbol, strategy, Sides.Sell);
    },
    onPriceBlur: (entry: TOBEntry) => {
      if (entry.quantity !== null || entry.price === null)
        return;
      props.createOrder({...entry, quantity: 10});
    },
    onCancelOrder: (entry: TOBEntry) => {
      props.cancelOrder(entry);
    },
  };

  const renderOrderTicket = () => {
    if (orderTicket === null)
      return <div/>;
    const createOrder = (quantity: number) => {
      if (orderTicket !== null) {
        props.createOrder({...orderTicket, quantity});
        // Remove the internal order ticket
        setOrderTicket(null);
      } else {
        // FIXME: throw an error or something
      }
    };
    return <OrderTicket order={orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={createOrder}/>;
  };

  const bulkCreateOrders = (entries: TOBRow[]) => {
    entries.forEach(({bid, offer}: TOBRow) => {
      if (offer.quantity !== null && offer.price !== null)
        props.createOrder(offer);
      if (bid.quantity !== null && bid.price !== null)
        props.createOrder(bid);
    });
    setRunWindowVisible(false);
  };

  const runWindow = (): ReactElement => (
    <Run
      id={toRunId(symbol, strategy)}
      symbol={symbol}
      strategy={strategy}
      tenors={tenors}
      toggleOCO={props.toggleOCO}
      oco={props.oco}
      user={props.user}
      onClose={() => setRunWindowVisible(false)}
      onSubmit={bulkCreateOrders}/>
  );

  const getData = (object: { tenor: string, table: TOBTable } | null): TOBTable => {
    const {rows} = props;
    if (!object) {
      return rows;
    } else {
      const {table} = object;
      // Get dob row keys
      const keys: string[] = Object.keys(table || {});
      if (keys.length === 0)
        return rows;
      return {...table};
    }
  };

  const user = {email};
  // Row renderer
  const renderRow = (props: any) => <Row {...props} user={user}/>;
  return (
    <React.Fragment>
      <TOBTileTitle symbol={symbol} strategy={strategy} symbols={symbols} products={products} setProduct={setProduct}
                    setSymbol={setSymbol} onClose={props.onClose}/>
      <div className={'window-content'}>
        <Table columns={columns(handlers)} rows={getData(currentTenor)} renderRow={renderRow}/>
      </div>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
      <ModalWindow render={runWindow} visible={runWindowVisible}/>
    </React.Fragment>
  );
});

