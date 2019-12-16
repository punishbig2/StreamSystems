import createDOBColumns from 'columns/dob';
import createTOBColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {TOBData} from 'components/TOB/data';
import {useDepthEmitter} from 'components/TOB/hooks/useDepthEmitter';
import {useInitializer} from 'components/TOB/hooks/useInitializer';
import {useSubscriber} from 'components/TOB/hooks/useSubscriber';
import {ActionTypes, reducer, State} from 'components/TOB/reducer';
import {Row} from 'components/TOB/row';
import {TOBTileTitle} from 'components/TOB/title';
import {Currency} from 'interfaces/currency';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {InvalidPrice, TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import {SettingsContext} from 'main';
import React, {ReactElement, useCallback, useContext, useEffect, useReducer, useState} from 'react';
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
  updateOrder,
  updateOrderQuantity,
} from 'redux/actions/tobActions';
import {ApplicationState} from 'redux/applicationState';
import {TOBActions} from 'redux/constants/tobConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
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
  subscribe: (symbol: string, strategy: string, tenor: string) => void;
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void;
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  setStrategy: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (order: Order, minSize: number) => void;
  cancelOrder: (order: Order) => void;
  cancelAll: (symbol: string, strategy: string, side: Sides) => void;
  updateOrder: (entry: Order) => void;
  getRunOrders: (symbol: string, strategy: string) => void;
  setRowStatus: (symbol: string, strategy: string, tenor: string, status: TOBRowStatus) => void;
  updateOrderQuantity: (order: Order) => void;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TOBActions.Initialize), rows)),
  subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
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
  setRowStatus: (symbol: string, strategy: string, tenor: string, status: TOBRowStatus) =>
    dispatch(setRowStatus(id, symbol, strategy, tenor, status)),
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

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
};

export const TOB: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const {symbols, symbol, products, strategy, tenors, connected, subscribe, rows} = props;
  const {getSnapshot, getRunOrders, onRowError} = props;
  const settings = useContext<Settings>(SettingsContext);
  const {email} = props.user;
  // Simple reducer for the element only
  const [state, dispatch] = useReducer(reducer, initialState);
  // Just one value without `dispatch' and stuff
  const [tobVisible, setTobVisible] = useState<boolean>(true);
  // Extract properties to manage them better
  const setProduct = ({target: {value}}: React.ChangeEvent<{ name?: string, value: unknown }>) => {
    props.setStrategy(value as string);
  };
  const setSymbol = ({target: {value}}: React.ChangeEvent<{ name?: string, value: unknown }>) => {
    props.setSymbol(value as string);
  };
  // Internal temporary reducer actions
  const setCurrentTenor = (tenor: string | null) => dispatch(createAction(ActionTypes.SetCurrentTenor, tenor));
  const setOrderTicket = (ticket: Order | null) => dispatch(createAction(ActionTypes.SetOrderTicket, ticket));
  const insertDepth = (data: any) => dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data));
  const showRunWindow = () => dispatch(createAction(ActionTypes.ShowRunWindow));
  const hideRunWindow = () => dispatch(createAction(ActionTypes.HideRunWindow));

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
  useSubscriber(rows, connected, symbol, strategy, subscribe, getSnapshot, getRunOrders);
  // Handler methods
  const {updateOrder, cancelAll, cancelOrder, createOrder} = props;
  const data: TOBData = {
    onTabbedOut: (input: HTMLInputElement, type: OrderTypes) => {
      switch (type) {
        case OrderTypes.Bid:
          skipTabIndex(input, 1, 1);
          break;
        case OrderTypes.Ofr:
          skipTabIndex(input, 3, 1);
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
    onOrderModified: (order: Order) => {
      if (order.price === InvalidPrice) {
        props.setRowStatus(order.symbol, order.strategy, order.tenor, TOBRowStatus.InvertedMarketsError);
      } else if ((order.status & OrderStatus.Owned) === 0 && order.price !== null) {
        if (order.quantity === null) {
          createOrder({...order, quantity: settings.defaultSize}, settings.minSize);
        } else {
          createOrder(order, settings.minSize);
        }
        props.setRowStatus(order.symbol, order.strategy, order.tenor, TOBRowStatus.Normal);
      } else {
        props.setRowStatus(order.symbol, order.strategy, order.tenor, TOBRowStatus.Normal);
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
      // FIXME: this should really be forbidden by the backend, but it's not
      if ((order.status & OrderStatus.PreFilled) === 0) {
        props.updateOrderQuantity({...order, quantity: newQuantity});
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
    buttonsEnabled: props.symbol !== '' && props.strategy !== '',
  };

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

  const bulkCreateOrders = (entries: Order[]) => {
    // Close the runs window
    hideRunWindow();
    // Create the orders
    entries.forEach((entry: Order) => props.createOrder(entry, settings.minSize));
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
      onClose={() => hideRunWindow()}
      onCancelOrder={props.cancelOrder}
      onSubmit={bulkCreateOrders}/>
  );
  const user = {email};
  const onRowErrorFn = useCallback((status: TOBRowStatus) => onRowError(status), [onRowError]);
  const renderRow: (props: any) => ReactElement = (props: any): ReactElement => {
    return (
      <Row {...props} user={user} depths={state.depths} onError={onRowErrorFn}/>
    );
  };
  const getDepthTable = (): ReactElement | null => {
    // @ts-ignore if this function is called `tobVisible' has to be false so for sure this will exist
    // and there's no way that `rows' will be undefined
    return <Table scrollable={false} columns={createDOBColumns(data)} rows={state.depths[state.tenor]}
                  renderRow={renderRow}/>;
  };
  // In case we lost the dob please reset this so that double
  // clicking the tenor keeps working
  useEffect(() => {
    if (state.tenor === null) {
      setTobVisible(true);
    } else {
      const depth: TOBTable = state.depths[state.tenor];
      const values: TOBRow[] = Object.values(depth);
      if (values.length === 0) {
        // Has the equivalent effect of hiding the depth book
        // but it will actually set the correct state for the
        // tenors to be double-clickable
        setCurrentTenor(null);
      } else {
        setTobVisible(false);
      }
    }
  }, [state.depths, state.tenor]);
  return (
    <>
      <TOBTileTitle symbol={symbol}
                    strategy={strategy}
                    symbols={symbols}
                    products={products}
                    setProduct={setProduct}
                    setSymbol={setSymbol}
                    onClose={props.onClose}
                    onShowRunWindow={showRunWindow}
                    runsDisabled={!symbol || !strategy}/>
      <div className={'window-content'}>
        <div className={tobVisible ? 'visible' : 'hidden'}>
          <Table scrollable={false} columns={createTOBColumns(data)} rows={rows} renderRow={renderRow}/>
        </div>
        {!tobVisible && getDepthTable()}
      </div>
      <ModalWindow render={renderOrderTicket} visible={state.orderTicket !== null}/>
      <ModalWindow render={runWindow} visible={state.runWindowVisible}/>
    </>
  );
});

