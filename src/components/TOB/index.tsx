import createTOBColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {createColumnData} from 'components/TOB/createColumnData';
import {TOBColumnData} from 'components/TOB/data';
import {useDepthEmitter} from 'components/TOB/hooks/useDepthEmitter';
import {useInitializer} from 'components/TOB/hooks/useInitializer';
import {useSubscriber} from 'components/TOB/hooks/useSubscriber';
import {DispatchProps, OwnProps, Props} from 'components/TOB/props';
import {ActionTypes, reducer, State} from 'components/TOB/reducer';
import {Row} from 'components/TOB/row';
import {TOBTileTitle} from 'components/TOB/title';
import {Order, Sides} from 'interfaces/order';
import {SelectEventData} from 'interfaces/selectEventData';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
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
  publishDarkPoolPrice,
  subscribeDarkPool,
  getDarkPoolSnapshot,
} from 'redux/actions/tobActions';
import {ApplicationState} from 'redux/applicationState';
import {TOBActions} from 'redux/constants/tobConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {RunState} from 'redux/stateDefs/runState';
import {WindowState} from 'redux/stateDefs/windowState';
import {Settings} from 'settings';
import {toRunId} from 'utils';
import {$$} from 'utils/stringPaster';

const cache: { [key: string]: DispatchProps } = {};
const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => {
  if (!cache[id]) {
    cache[id] = {
      initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TOBActions.Initialize), rows)),
      subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
      subscribeDarkPool: (symbol: string, strategy: string, tenor: string) => dispatch(subscribeDarkPool(symbol, strategy, tenor)),
      unsubscribe: (symbol: string, strategy: string, tenor: string) => dispatch(unsubscribe(symbol, strategy, tenor)),
      setStrategy: (value: string) => dispatch(createAction($$(id, TOBActions.SetStrategy), value)),
      createOrder: (order: Order, minSize: number) => dispatch(createOrder(id, order, minSize)),
      setSymbol: (value: string) => dispatch(createAction($$(id, TOBActions.SetSymbol), value)),
      toggleOCO: () => dispatch(createAction($$(id, TOBActions.ToggleOCO))),
      cancelOrder: (entry: Order) => dispatch(cancelOrder(id, entry)),
      getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(id, symbol, strategy, tenor)),
      getDarkPoolSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getDarkPoolSnapshot(id, symbol, strategy, tenor)),
      cancelAll: (symbol: string, strategy: string, side: Sides) => dispatch(cancelAll(id, symbol, strategy, side)),
      updateOrder: (entry: Order) => dispatch(updateOrder(id, entry)),
      getRunOrders: (symbol: string, strategy: string) => dispatch(getRunOrders(id, symbol, strategy)),
      updateOrderQuantity: (order: Order) => dispatch(updateOrderQuantity(id, order)),
      setRowStatus: (order: Order, status: TOBRowStatus) => dispatch(setRowStatus(id, order, status)),
      publishDarkPoolPrice: (symbol: string, strategy: string, tenor: string, price: number) =>
        dispatch(publishDarkPoolPrice(id, symbol, strategy, tenor, price)),
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

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
};

export const TOB: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const {oco, toggleOCO} = props;
  const {getSnapshot, getRunOrders, onRowError, subscribe, unsubscribe} = props;
  const {getDarkPoolSnapshot, subscribeDarkPool} = props;
  const {symbols, symbol, products, strategy, tenors, connected, rows} = props;
  const settings = useContext<Settings>(SettingsContext);
  const {email} = props.user;
  const [state, dispatch] = useReducer(reducer, initialState);

  const setProduct = ({target: {value}}: React.ChangeEvent<SelectEventData>) => {
    props.setStrategy(value as string);
  };

  const setSymbol = ({target: {value}}: React.ChangeEvent<SelectEventData>) => {
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
  useSubscriber(
    rows,
    connected,
    symbol,
    strategy,
    subscribe,
    subscribeDarkPool,
    unsubscribe,
    getSnapshot,
    getDarkPoolSnapshot,
    getRunOrders,
  );
  // Handler methods
  const {cancelOrder, createOrder} = props;
  const data: TOBColumnData = createColumnData(state, props, setCurrentTenor, setOrderTicket, settings);
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
