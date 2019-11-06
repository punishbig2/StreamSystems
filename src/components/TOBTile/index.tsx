import tobColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table, TOBHandlers} from 'components/Table';
import {TOBTileTitle} from 'components/TOBTile/title';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order, Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect, useState} from 'react';
import {MosaicBranch, MosaicWindow} from 'react-mosaic-component';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {cancelOrder, createOrder, getSnapshot} from 'redux/actions/tileActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {createRowReducer} from 'redux/reducers/rowReducer';
import {SignalRAction} from 'redux/signalRAction';
import {TileState} from 'redux/stateDefs/tileState';
import {injectNamedReducer} from 'redux/store';
import {$$} from 'utils/stringPaster';

const emptyOffer = (tenor: string, symbol: string, strategy: string, user: string): TOBEntry => {
  return {firm: '', type: EntryTypes.Ask, tenor, symbol, strategy, user, price: null, size: null, quantity: 10};
};

const emptyBid = (tenor: string, symbol: string, strategy: string, user: string): TOBEntry => {
  return {firm: '', type: EntryTypes.Bid, tenor, symbol, strategy, user, price: null, size: null, quantity: 10};
};

interface OwnProps {
  id: string;
  tenors: string[],
  products: Strategy[];
  symbols: string[];
  user: User;
  path: MosaicBranch[];
  onClose: () => void;
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
  createOrder: (entry: TOBEntry, side: Sides, quantity: number) => void;
  cancelOrder: (orderId: string, tenor: string, symbol: string, strategy: string) => void;
}

// FIXME: this could probably be extracted to a generic function
const mapStateToProps: MapStateToProps<TileState, OwnProps, ApplicationState> =
  (state: ApplicationState, ownProps: OwnProps): TileState => {
    const generalizedState = state as any;
    if (generalizedState.hasOwnProperty(ownProps.id)) {
      // Forcing typescript to listen to me >(
      return generalizedState[ownProps.id] as TileState;
    } else {
      return {} as TileState;
    }
  };

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TileActions.Initialize), rows)),
  subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
  setStrategy: (value: string) => dispatch(createAction($$(id, TileActions.SetStrategy), value)),
  createOrder: (order: TOBEntry, side: Sides, quantity: number) => dispatch(createOrder(id, order, side, quantity)),
  setSymbol: (value: string) => dispatch(createAction($$(id, TileActions.SetSymbol), value)),
  toggleOCO: () => dispatch(createAction($$(id, TileActions.ToggleOCO))),
  cancelOrder: (orderId: string, tenor: string, symbol: string, strategy: string) => dispatch(cancelOrder(id, orderId, tenor, symbol, strategy)),
  getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(symbol, strategy, tenor)),
});

const withRedux: (ignored: any) => any = connect<TileState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & TileState;

const initializeMe = (props: Props) => {
  const {symbol, strategy, connected, tenors, user} = props;
  if (!connected || symbol === '' || strategy === '')
    return;
  const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
    object[item.id] = item;
    // Return the accumulator
    return object;
  };
  const tenorToNumber = (value: string) => {
    // FIXME: probably search the number boundary
    const multiplier: number = Number(value.substr(0, 1));
    const unit: string = value.substr(1);
    switch (unit) {
      case 'W':
        return multiplier;
      case 'M':
        return 5 * multiplier;
      case 'Y':
        return 60 * multiplier;
    }
    return 0;
  };
  const rows: TOBRow[] = tenors.map((tenor: string) => {
    // This is here because javascript is super stupid and `connected' can change
    // while we're subscribing combinations.
    //
    // Ideally, we should implement the ability to stop
    if (connected) {
      const id: string = $$(tenor, symbol, strategy);
      const row: TOBRow = {
        tenor: tenor,
        id: $$('__ROW', id),
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
  }).sort((a: TOBRow, b: TOBRow) => {
    const at: string = a.tenor;
    const bt: string = b.tenor;
    return tenorToNumber(at) - tenorToNumber(bt);
  });
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
  const [currentTenor, setCurrentTenor] = useState<{ tenor: string, table: TOBTable } | null>(null);
  const [runTable, setRunTable] = useState<TOBTable | null>(null);
  // Extract properties to manage them better
  const {symbols, symbol, products, strategy, tenors, connected, user} = props;
  const setProduct = ({target: {value}}: { target: HTMLSelectElement }) => props.setStrategy(value);
  const setSymbol = ({target: {value}}: { target: HTMLSelectElement }) => props.setSymbol(value);
  // SubscribeForMarketData all the tenors for the given pair
  useEffect(() => {
    initializeMe(props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, strategy, tenors, connected]);

  const handlers: TOBHandlers = {
    onCreateOrder: (entry: TOBEntry, price: number) => {
      if (entry.quantity) {
        props.createOrder({...entry, price}, entry.type === EntryTypes.Bid ? Sides.Buy : Sides.Sell, entry.quantity);
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
    onRunButtonClicked: (table: TOBTable) => {
      setRunTable(table);
    },
    onRefBidsButtonClicked: () => {
    },
    onRefOffersButtonClicked: () => {
    },
    onOfferCanceled: (offer: TOBEntry) => {
      console.log(offer);
    },
    onBidCanceled: (bid: TOBEntry) => {
      console.log(bid);
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
        props.createOrder(orderTicket, orderTicket.type === EntryTypes.Bid ? Sides.Buy : Sides.Sell, quantity);
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
      props.createOrder(bid, Sides.Sell, bid.quantity as number);
      props.createOrder(offer, Sides.Buy, offer.quantity as number);
    });
    setRunTable(null);
  };

  const toolbar: ReactElement = (
      <TOBTileTitle
        symbol={symbol}
        strategy={strategy}
        symbols={symbols}
        products={products}
        setProduct={setProduct}
        setSymbol={setSymbol}
        onClose={props.onClose}/>
    )
  ;

  const renderRun = () => {
    if (!runTable)
      return null;
    return (
      <Run
        symbol={symbol}
        strategy={strategy}
        toggleOCO={props.toggleOCO}
        oco={props.oco}
        table={runTable}
        user={props.user}
        onClose={() => setRunTable(null)}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const getData = (object: { tenor: string, table: TOBTable } | null): TOBTable | undefined => {
    const {rows} = props;
    if (!object) {
      return rows;
    } else {
      const {tenor, table} = object;
      const missing: TOBTable = {};
      // Get dob row keys
      const keys = Object.keys(table || {});
      for (let i = 0; i < Object.keys(rows).length - keys.length; ++i) {
        // Fill the missing items in the DOB table
        missing[keys.length + i] = {
          tenor: tenor,
          id: `${tenor}.${i}`,
          offer: emptyOffer(tenor, symbol, strategy, user.email),
          bid: emptyBid(tenor, symbol, strategy, user.email),
          spread: null,
          mid: null,
        };
      }
      return {...table, ...missing};
    }
  };

  return (
    <React.Fragment>
      <MosaicWindow<string> title={''} path={props.path} toolbarControls={toolbar}>
        <Table<TOBHandlers> columns={tobColumns} rows={getData(currentTenor)} handlers={handlers} user={props.user}/>
      </MosaicWindow>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
      <ModalWindow render={renderRun} visible={runTable !== null}/>
    </React.Fragment>
  );
});
