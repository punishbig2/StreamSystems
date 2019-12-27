import createTOBColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {PriceErrors} from 'components/Table/CellRenderers/Price';
import {TOBColumnData} from 'components/TOB/data';
import {useDepthEmitter} from 'components/TOB/hooks/useDepthEmitter';
import {useInitializer} from 'components/TOB/hooks/useInitializer';
import {useSubscriber} from 'components/TOB/hooks/useSubscriber';
import {ActionTypes, reducer, State} from 'components/TOB/reducer';
import {Row} from 'components/TOB/row';
import {TOBTileTitle} from 'components/TOB/title';
import {usePrevious} from 'hooks/usePrevious';
import {Currency} from 'interfaces/currency';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {SelectEventData} from 'interfaces/selectEventData';
import {Strategy} from 'interfaces/strategy';
import {InvalidPrice, TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {TenorType} from 'interfaces/w';
import {SettingsContext} from 'main';
import React, {ReactElement, useCallback, useContext, useEffect, useMemo, useReducer} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {
  cancelAll,
  cancelOrder,
  createOrder,
  getRunOrders,
  getSnapshot,
  setRowStatus,
  subscribe,
  unsubscribe,
  updateOrder,
  updateOrderQuantity,
} from 'redux/actions/tobActions';
import {ApplicationState} from 'redux/applicationState';
import {TOBActions} from 'redux/constants/tobConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {Subscriber} from 'redux/signalRAction';
import {RunState} from 'redux/stateDefs/runState';
import {WindowState} from 'redux/stateDefs/windowState';
import {Settings} from 'settings';
import {toRunId} from 'utils';
import {skipTabIndex} from 'utils/skipTab';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  user: User;
  tenors: string[],
  products: Strategy[];
  symbols: Currency[];
  connected: boolean;
  setWindowTitle: (id: string, title: string) => void;
  onRowError: (status: TOBRowStatus) => void;
  onClose?: () => void;
}

interface DispatchProps {
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  unsubscribe: Subscriber;
  subscribe: Subscriber;
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void;
  setStrategy: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (order: Order, minSize: number) => void;
  cancelOrder: (order: Order) => void;
  cancelAll: (symbol: string, strategy: string, side: Sides) => void;
  updateOrder: (entry: Order) => void;
  getRunOrders: (symbol: string, strategy: string) => void;
  setRowStatus: (order: Order, status: TOBRowStatus) => void;
  updateOrderQuantity: (order: Order) => void;
}

const cache: { [key: string]: DispatchProps } = {};
const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => {
  if (!cache[id]) {
    cache[id] = {
      initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TOBActions.Initialize), rows)),
      subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
      unsubscribe: (symbol: string, strategy: string, tenor: string) => dispatch(unsubscribe(symbol, strategy, tenor)),
      setStrategy: (value: string) => dispatch(createAction($$(id, TOBActions.SetStrategy), value)),
      createOrder: (order: Order, minSize: number) => dispatch(createOrder(id, order, minSize)),
      setSymbol: (value: string) => dispatch(createAction($$(id, TOBActions.SetSymbol), value)),
      toggleOCO: () => dispatch(createAction($$(id, TOBActions.ToggleOCO))),
      cancelOrder: (entry: Order) => dispatch(cancelOrder(id, entry)),
      getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(id, symbol, strategy, tenor)),
      cancelAll: (symbol: string, strategy: string, side: Sides) => dispatch(cancelAll(id, symbol, strategy, side)),
      updateOrder: (entry: Order) => dispatch(updateOrder(id, entry)),
      getRunOrders: (symbol: string, strategy: string) => dispatch(getRunOrders(id, symbol, strategy)),
      updateOrderQuantity: (order: Order) => dispatch(updateOrderQuantity(id, order)),
      setRowStatus: (order: Order, status: TOBRowStatus) => dispatch(setRowStatus(id, order, status)),
    };
  }
  return cache[id];
};

const nextSlice = (applicationState: ApplicationState, props: OwnProps): WindowState & RunState => {
  const generic: { [key: string]: any } = applicationState;
  if (generic.hasOwnProperty(props.id)) {
    const localState: WindowState = generic[props.id];
    return {...localState, ...generic[toRunId(localState.symbol, localState.strategy)]};
  }
  return {} as WindowState & RunState;
};

const withRedux = connect<WindowState & RunState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<WindowState & RunState, OwnProps, ApplicationState>(nextSlice),
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & WindowState & RunState;

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
};

type Fn1 = (tenor: TenorType | null) => void;
type Fn2 = (order: Order) => void;
const createColumnData = (state: State, setCurrentTenor: Fn1, setOrderTicket: Fn2, props: Props, settings: Settings) => {
  const {symbol, strategy} = props;
  // Dispatch properties
  const {cancelAll, cancelOrder, setRowStatus, createOrder, updateOrder, updateOrderQuantity} = props;
  return {
    onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => {
      switch (type) {
        case OrderTypes.Bid:
          skipTabIndex(input, 1, 1);
          break;
        case OrderTypes.Ofr:
          skipTabIndex(input, 3, 1);
          break;
      }
    },
    onTenorSelected: (tenor: string) => {
      if (state.tenor === null) {
        setCurrentTenor(tenor);
      } else {
        setCurrentTenor(null);
      }
    },
    onDoubleClick: (type: OrderTypes, entry: Order) => {
      setOrderTicket({...entry, type});
    },
    onRefBidsButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Buy);
    },
    onRefOfrsButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Sell);
    },
    onOrderError: (order: Order, error: PriceErrors, input: HTMLInputElement) => {
      if (error === PriceErrors.GreaterThanMax || error === PriceErrors.LessThanMin) {
        setRowStatus(order, TOBRowStatus.InvertedMarketsError);
        input.focus();
      }
    },
    onOrderModified: (order: Order) => {
      if (order.price === InvalidPrice) {
      } else if ((order.status & OrderStatus.Owned) === 0 && order.price !== null) {
        if (order.quantity === null) {
          createOrder({...order, quantity: settings.defaultSize}, settings.minSize);
        } else {
          createOrder(order, settings.minSize);
        }
        setRowStatus(order, TOBRowStatus.Normal);
      } else {
        setRowStatus(order, TOBRowStatus.Normal);
        if (order.quantity !== null || order.price === null)
          return;
        createOrder(order, settings.minSize);
      }
    },
    onCancelOrder: (order: Order, cancelRelated: boolean = true) => {
      if (cancelRelated) {
        const rows: TOBRow[] = Object.values(state.depths[order.tenor]);
        rows.forEach((row: TOBRow) => {
          const targetEntry: Order = order.type === OrderTypes.Bid ? row.bid : row.ofr;
          if ((targetEntry.status & OrderStatus.Owned) !== 0) {
            cancelOrder(targetEntry);
          }
        });
      } else {
        cancelOrder(order);
      }
    },
    onQuantityChange: (order: Order, newQuantity: number | null, input: HTMLInputElement) => {
      console.trace();
      if ((order.status & OrderStatus.PreFilled) === 0) {
        updateOrderQuantity({...order, quantity: newQuantity});
      } else if ((order.status & OrderStatus.Owned) !== 0 && newQuantity !== null) {
        if (order.quantity === null) {
          // FIXME: perhaps let the user know?
          throw new Error('this is impossible, or a backend error');
        } else if (order.quantity > newQuantity) {
          updateOrder({...order, quantity: newQuantity});
        } else if (order.quantity < newQuantity) {
          cancelOrder(order);
          createOrder({...order, quantity: newQuantity}, settings.minSize);
        }
      } else {
        const {quantity} = order;
        // FIXME: we must reset the order quantity but this seems unsafe
        //        because it's happening outside of react
        input.value = quantity ? quantity.toFixed(0) : '';
        // Artificially emit the change event
        const event = document.createEvent('HTMLEvents');
        event.initEvent('change', false, true);
        // Attempt to pretend we can emit the onChange
        input.dispatchEvent(event);
      }
      skipTabIndex(input, 1, 0);
    },
    aggregatedSz: state.aggregatedSz,
    buttonsEnabled: symbol !== '' && strategy !== '',
  };
};

export const TOB: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const {oco, toggleOCO} = props;
  const {getSnapshot, getRunOrders, onRowError, subscribe, unsubscribe} = props;
  const {symbols, symbol, products, strategy, tenors, connected, rows} = props;

  const settings = useContext<Settings>(SettingsContext);
  const previous = usePrevious<any>(props.subscribe);
  if (previous !== props.subscribe) {
    console.log('what the fuck?');
  }

  const {email} = props.user;
  // Simple reducer for the element only
  const [state, dispatch] = useReducer(reducer, initialState);
  // Just one value without `dispatch' and stuff
  // Extract properties to manage them better
  const setProduct = ({target: {value}}: React.ChangeEvent<SelectEventData>) => {
    console.log(value);
    props.setStrategy(value as string);
  };
  const setSymbol = ({target: {value}}: React.ChangeEvent<SelectEventData>) => {
    console.log(value);
    props.setSymbol(value as string);
  };

  // Internal temporary reducer actions
  const setCurrentTenor = useCallback((tenor: string | null) => dispatch(createAction(ActionTypes.SetCurrentTenor, tenor)), [dispatch]);
  const setOrderTicket = useCallback((ticket: Order | null) => dispatch(createAction(ActionTypes.SetOrderTicket, ticket)), [dispatch]);
  const insertDepth = useCallback((data: any) => dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data)), [dispatch]);
  const showRunWindow = useCallback(() => dispatch(createAction(ActionTypes.ShowRunWindow)), [dispatch]);
  const hideRunWindow = useCallback(() => dispatch(createAction(ActionTypes.HideRunWindow)), [dispatch]);

  const {setWindowTitle} = props;
  useEffect(() => {
    if (setWindowTitle && !!symbol && !!strategy) {
      setWindowTitle(props.id, `${symbol} ${strategy}`);
    }
  }, [props.id, symbol, strategy, setWindowTitle]);
  // Create depths for each tenor
  useDepthEmitter(tenors, symbol, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(tenors, symbol, strategy, email, props.initialize);
  // Subscribe to signal-r
  useSubscriber(rows, connected, symbol, strategy, subscribe, unsubscribe, getSnapshot, getRunOrders);
  // Handler methods
  const {cancelOrder, createOrder} = props;
  const data: TOBColumnData = createColumnData(state, setCurrentTenor, setOrderTicket, props, settings);

  const renderOrderTicket = () => {
    if (state.orderTicket === null)
      return <div/>;
    const onSubmit = (order: Order) => {
      createOrder(order, settings.minSize);
      // Remove the internal order ticket
      setOrderTicket(null);
    };
    return <OrderTicket order={state.orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={onSubmit}/>;
  };

  const bulkCreateOrders = useCallback((entries: Order[]) => {
    // Close the runs window
    hideRunWindow();
    // Create the orders
    entries.forEach((entry: Order) => createOrder(entry, settings.minSize));
  }, [hideRunWindow, createOrder, settings.minSize]);

  const runID = useMemo(() => toRunId(symbol, strategy), [symbol, strategy]);

  const runWindow = (
    <Run
      id={runID}
      symbol={symbol}
      strategy={strategy}
      tenors={tenors}
      toggleOCO={toggleOCO}
      oco={oco}
      onClose={hideRunWindow}
      onCancelOrder={cancelOrder}
      onSubmit={bulkCreateOrders}/>
  );

  const onRowErrorFn = useCallback((status: TOBRowStatus) => onRowError(status), [onRowError]);
  const renderRow = (props: any): ReactElement => {
    return (
      <Row {...props} depths={state.depths} onError={onRowErrorFn} displayOnly={false}/>
    );
  };
  const renderDOBRow = (props: TOBRow): ReactElement => {
    return (
      <Row {...props} depths={[]} onError={onRowErrorFn} displayOnly={true}/>
    );
  };
  const getDepthTable = (): ReactElement | null => {
    if (state.tenor === null)
      return null;
    const rows: TOBTable = {...state.depths[state.tenor]};
    return <Table scrollable={false}
                  columns={createTOBColumns(data, true)}
                  rows={rows}
                  renderRow={renderDOBRow}/>;
  };
  // In case we lost the dob please reset this so that double
  // clicking the tenor keeps working
  useEffect(() => {
    if (state.tenor === null) {
      return;
    } else {
      const depth: TOBTable = state.depths[state.tenor];
      const values: TOBRow[] = Object.values(depth);
      if (values.length === 0) {
        // Has the equivalent effect of hiding the depth book
        // but it will actually set the correct state for the
        // tenors to be double-clickable
        setCurrentTenor(null);
      }
    }
  }, [setCurrentTenor, state.depths, state.tenor]);
  return (
    <>
      <TOBTileTitle symbol={symbol}
                    strategy={strategy}
                    symbols={symbols}
                    products={products}
                    runsDisabled={!symbol || !strategy}
                    connected={connected}
                    setProduct={setProduct}
                    setSymbol={setSymbol}
                    onClose={props.onClose}
                    onShowRunWindow={showRunWindow}/>
      <div className={'window-content'}>
        <div className={state.tenor === null ? 'visible' : 'invisible'}>
          <Table scrollable={false} columns={createTOBColumns(data)} rows={rows} renderRow={renderRow}/>
        </div>
        <div className={'depth-table'}>
          {getDepthTable()}
        </div>
      </div>
      <ModalWindow render={renderOrderTicket} visible={state.orderTicket !== null}/>
      <ModalWindow render={() => runWindow} visible={state.runWindowVisible}/>
    </>
  );
});

TOB.whyDidYouRender = true;
