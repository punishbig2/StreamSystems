import tobColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table, TOBHandlers} from 'components/Table';
import {TOBTileTitle} from 'components/TOBTile/title';
import {TenorType} from 'interfaces/md';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order, Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect, useState} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {cancelAll, cancelOrder, createOrder, getSnapshot} from 'redux/actions/tileActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {createRowReducer} from 'redux/reducers/rowReducer';
import {SignalRAction} from 'redux/signalRAction';
import {WindowState} from 'redux/stateDefs/windowState';
import {injectNamedReducer} from 'redux/store';
import {toRowId} from 'utils';
import {compareTenors, emptyBid, emptyOffer} from 'utils/dataGenerators';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  tenors: string[],
  products: Strategy[];
  symbols: string[];
  user: User;
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
  createOrder: (entry: TOBEntry, side: Sides, symbol: string, strategy: string, quantity: number) => void;
  cancelOrder: (orderId: string, tenor: string, symbol: string, strategy: string) => void;
  cancelAll: (type: EntryTypes) => void;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TileActions.Initialize), rows)),
  subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
  setStrategy: (value: string) => dispatch(createAction($$(id, TileActions.SetStrategy), value)),
  createOrder: (order: TOBEntry, side: Sides, symbol: string, strategy: string, quantity: number) => dispatch(createOrder(id, order, side, symbol, strategy, quantity)),
  setSymbol: (value: string) => dispatch(createAction($$(id, TileActions.SetSymbol), value)),
  toggleOCO: () => dispatch(createAction($$(id, TileActions.ToggleOCO))),
  cancelOrder: (orderId: string, tenor: string, symbol: string, strategy: string) => dispatch(cancelOrder(id, orderId, tenor, symbol, strategy)),
  getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(id, symbol, strategy, tenor)),
  cancelAll: (type: EntryTypes) => dispatch(cancelAll(id, type)),
});

// FIXME: this could probably be extracted to a generic function
const mapStateToProps: MapStateToProps<WindowState, OwnProps, ApplicationState> =
  (state: ApplicationState, ownProps: OwnProps): WindowState => {
    const generalizedState = state as any;
    if (generalizedState.hasOwnProperty(ownProps.id)) {
      // Forcing typescript to listen to me >(
      return generalizedState[ownProps.id] as WindowState;
    } else {
      return {} as WindowState;
    }
  };

const withRedux: (ignored: any) => any = connect<WindowState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WindowState;

const initializeMe = (props: Props) => {
  const {symbol, strategy, connected, tenors, user} = props;
  if (!connected || symbol === '' || strategy === '')
    return;
  const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };

  const rows: TOBRow[] = tenors.map((tenor: TenorType) => {
    // This is here because javascript is super stupid and `connected' can change
    // while we're subscribing combinations.
    //
    // Ideally, we should implement the ability to stop
    if (connected) {
      const row: TOBRow = {
        tenor: tenor,
        id: toRowId(tenor, symbol, strategy),
        bid: emptyBid(tenor, symbol, strategy, user.email),
        darkPool: '',
        offer: emptyOffer(tenor, symbol, strategy, user.email),
        dob: undefined,
        mid: null,
        spread: null,
      };
      // Return row
      return row;
    }
    return {} as TOBRow;
  }).sort(compareTenors);
  rows.forEach((row: TOBRow) => {
    // Get snapshot W
    props.getSnapshot(symbol, strategy, row.tenor);
    // Listen to websocket incoming messages
    props.subscribe(symbol, strategy, row.tenor);
    // Inject a new reducer
    injectNamedReducer(row.id, createRowReducer, {row});
  });
  // Initialize with base table
  props.initialize(rows.reduce(reducer, {}));
};

export const TOBTile: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const [orderTicket, setOrderTicket] = useState<TOBEntry | null>(null);
  const [runWindowVisible, setRunWindowVisible] = useState<boolean>(false);
  const [currentTenor, setCurrentTenor] = useState<{ tenor: string, table: TOBTable } | null>(null);
  // Extract properties to manage them better
  const {symbols, symbol, products, strategy, tenors, connected} = props;
  const setProduct = ({target: {value}}: { target: HTMLSelectElement }) => props.setStrategy(value);
  const setSymbol = ({target: {value}}: { target: HTMLSelectElement }) => props.setSymbol(value);
  // SubscribeForMarketData all the tenors for the given pair
  useEffect(() => {
    initializeMe(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, connected]);

  const handlers: TOBHandlers = {
    onCreateOrder: (entry: TOBEntry, price: number, type: EntryTypes) => {
      if (entry.quantity) {
        props.createOrder({
          ...entry,
          price,
        }, type === EntryTypes.Bid ? Sides.Buy : Sides.Sell, symbol, strategy, entry.quantity);
      }
    },
    onTenorSelected: (tenor: string, table: TOBTable) => {
      if (currentTenor === null) {
        setCurrentTenor({tenor, table});
      } else {
        setCurrentTenor(null);
      }
    },
    onDoubleClick: (type: EntryTypes, entry: TOBEntry) => {
      if (entry.type === EntryTypes.Ask) {
        setOrderTicket(entry);
      } else {
        setOrderTicket(entry);
      }
    },
    onRunButtonClicked: () => {
      setRunWindowVisible(true);
    },
    onRefBidsButtonClicked: () => {
      props.cancelAll(EntryTypes.Bid);
    },
    onRefOffersButtonClicked: () => {
      props.cancelAll(EntryTypes.Ask);
    },
    onCancelOrder: (entry: TOBEntry) => {
      const key: string = $$(entry.tenor, entry.type === EntryTypes.Bid ? Sides.Buy : Sides.Sell);
      const order: Order = props.orders[key];
      if (!order) {
        console.log('Warning: order not found');
        return;
      }
      // Execute cancellation
      props.cancelOrder(order.OrderID, entry.tenor, entry.symbol, entry.strategy);
    },
  };

  const renderOrderTicket = () => {
    if (orderTicket === null)
      return <div/>;
    const createOrder = (quantity: number) => {
      if (orderTicket !== null) {
        props.createOrder(orderTicket, orderTicket.type === EntryTypes.Bid ? Sides.Buy : Sides.Sell, symbol, strategy, quantity);
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
      props.createOrder(bid, Sides.Buy, symbol, strategy, bid.quantity as number);
      props.createOrder(offer, Sides.Sell, symbol, strategy, offer.quantity as number);
    });
    setRunWindowVisible(false);
  };

  const runWindow: ReactElement = (
    <Run
      symbol={symbol}
      strategy={strategy}
      toggleOCO={props.toggleOCO}
      oco={props.oco}
      tenors={tenors}
      user={props.user}
      onClose={() => setRunWindowVisible(false)}
      orders={props.orders}
      onSubmit={bulkCreateOrders}/>
  );

  const getData = (object: { tenor: string, table: TOBTable } | null): TOBTable | undefined => {
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

  return (
    <React.Fragment>
      <TOBTileTitle symbol={symbol} strategy={strategy} symbols={symbols} products={products} setProduct={setProduct}
                    setSymbol={setSymbol}/>
      <Table<TOBHandlers> columns={tobColumns} rows={getData(currentTenor)} handlers={handlers} user={props.user}/>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
      <ModalWindow render={() => runWindow} visible={runWindowVisible}/>
    </React.Fragment>
  );
});
