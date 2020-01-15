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
import {Order, Sides, OrderStatus, DarkPoolOrder} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {SettingsContext} from 'main';
import React, {ReactElement, useCallback, useContext, useEffect, useMemo, useReducer} from 'react';
import {connect} from 'react-redux';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {RunState} from 'redux/stateDefs/runState';
import {WindowState} from 'redux/stateDefs/windowState';
import {Settings} from 'settings';
import {toRunId} from 'utils';
import {$$} from 'utils/stringPaster';
import {
  subscribe,
  subscribeDarkPool,
  unsubscribe,
  getSnapshot,
  getDarkPoolSnapshot,
  cancelAll,
  updateOrder,
  getRunOrders,
  updateOrderQuantity,
  setRowStatus,
  publishDarkPoolPrice,
  createDarkPoolOrder,
  createOrder,
  cancelOrder,
  setStrategy,
  setSymbol,
} from 'redux/actions/tobActions';
import {TOBActions} from 'redux/reducers/tobReducer';
import {DarkPoolTicket, DarkPoolTicketData} from 'components/DarkPoolTicket';
import {priceFormatter} from 'utils/priceFormatter';

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
);

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
  darkPoolTicket: null,
};

export const TOB: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const {id, dispatch: reduxDispatch} = props;
  const {onRowError} = props;
  const {symbols, symbol, products, strategy, tenors, connected, rows, user, personality} = props;
  const settings = useContext<Settings>(SettingsContext);
  const {email} = props.user;
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(() => ({
    initialize: (rows: { [tenor: string]: TOBRow }) => reduxDispatch(createAction($$(id, TOBActions.Initialize), rows)),
    subscribe: (symbol: string, strategy: string, tenor: string) => reduxDispatch(subscribe(symbol, strategy, tenor)),
    subscribeDarkPool: (symbol: string, strategy: string, tenor: string) => reduxDispatch(subscribeDarkPool(symbol, strategy, tenor)),
    unsubscribe: (symbol: string, strategy: string, tenor: string) => reduxDispatch(unsubscribe(symbol, strategy, tenor)),
    createOrder: (order: Order, personality: string, minSize: number) => reduxDispatch(createOrder(id, personality, order, minSize)),
    setStrategy: (value: string) => reduxDispatch(setStrategy(id, value)),
    setSymbol: (value: string) => reduxDispatch(setSymbol(id, value)),
    cancelOrder: (order: Order) => reduxDispatch(cancelOrder(id, order)),
    getSnapshot: (symbol: string, strategy: string, tenor: string) => reduxDispatch(getSnapshot(id, symbol, strategy, tenor)),
    getDarkPoolSnapshot: (symbol: string, strategy: string, tenor: string) => reduxDispatch(getDarkPoolSnapshot(id, symbol, strategy, tenor)),
    getRunOrders: (symbol: string, strategy: string) => reduxDispatch(getRunOrders(id, symbol, strategy)),
    cancelAll: (symbol: string, strategy: string, side: Sides) => reduxDispatch(cancelAll(id, symbol, strategy, side)),
    updateOrder: (entry: Order) => reduxDispatch(updateOrder(id, entry)),
    updateOrderQuantity: (order: Order) => reduxDispatch(updateOrderQuantity(id, order)),
    setRowStatus: (order: Order, status: TOBRowStatus) => reduxDispatch(setRowStatus(id, order, status)),
    publishDarkPoolPrice: (symbol: string, strategy: string, tenor: string, price: number) => reduxDispatch(publishDarkPoolPrice(id, symbol, strategy, tenor, price)),
    onDarkPoolDoubleClicked: (tenor: string, price: number) => setDarkPoolTicket({tenor, price}),
    createDarkPoolOrder: (order: DarkPoolOrder, personality: string) => reduxDispatch(createDarkPoolOrder(order, personality)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [id, reduxDispatch]);


  // Internal temporary reducer actions
  const setCurrentTenor = useCallback((tenor: string | null) => dispatch(createAction(ActionTypes.SetCurrentTenor, tenor)), []);
  const setOrderTicket = useCallback((ticket: Order | null) => dispatch(createAction(ActionTypes.SetOrderTicket, ticket)), []);
  const setDarkPoolTicket = useCallback((price: DarkPoolTicketData | null) => dispatch(createAction(ActionTypes.SetDarkPoolTicket, price)), []);
  const insertDepth = useCallback((data: any) => dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data)), []);
  const showRunWindow = useCallback(() => dispatch(createAction(ActionTypes.ShowRunWindow)), []);
  const hideRunWindow = useCallback(() => dispatch(createAction(ActionTypes.HideRunWindow)), []);

  const {setWindowTitle} = props;
  useEffect(() => {
    if (setWindowTitle && !!symbol && !!strategy) {
      setWindowTitle(props.id, `${symbol} ${strategy}`);
    }
  }, [props.id, symbol, strategy, setWindowTitle]);
  // Create depths for each tenor
  useDepthEmitter(tenors, symbol, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(tenors, symbol, strategy, email, actions.initialize);
  // Subscribe to signal-r
  useSubscriber(
    rows,
    connected,
    symbol,
    strategy,
    actions.subscribe,
    actions.subscribeDarkPool,
    actions.unsubscribe,
    actions.getSnapshot,
    actions.getDarkPoolSnapshot,
    actions.getRunOrders,
  );
  // Handler methods
  const data: TOBColumnData = useMemo(() => {
    return createColumnData(
      actions,
      state,
      symbol,
      strategy,
      user,
      setCurrentTenor,
      setOrderTicket,
      settings,
      personality,
    );
  }, [actions, symbol, strategy, state, settings, setCurrentTenor, setOrderTicket, user, personality]);
  const renderDarkPoolTicket = () => {
    if (state.darkPoolTicket === null)
      return <div/>;
    const onSubmit = (order: DarkPoolOrder) => {
      actions.createDarkPoolOrder(order, personality);
      setDarkPoolTicket(null);
    };
    const ticket: DarkPoolTicketData = state.darkPoolTicket;
    return (
      <DarkPoolTicket
        onSubmit={onSubmit}
        onCancel={() => setDarkPoolTicket(null)}
        price={priceFormatter(ticket.price)}
        quantity={'10'}
        tenor={ticket.tenor}
        strategy={strategy}
        symbol={symbol}
        user={user.email}/>
    );
  };
  const renderOrderTicket = () => {
    if (state.orderTicket === null)
      return <div/>;
    const onSubmit = (order: Order) => {
      actions.createOrder(order, personality, settings.minSize);
      // Remove the internal order ticket
      setOrderTicket(null);
    };
    return <OrderTicket order={state.orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={onSubmit}/>;
  };

  const bulkCreateOrders = useCallback((entries: Order[]) => {
    // Close the runs window
    hideRunWindow();
    // Create the orders
    entries.forEach((order: Order) => {
      if ((order.status & OrderStatus.PreFilled) !== 0 || (order.status & OrderStatus.Active) !== 0) {
        actions.cancelOrder(order);
      }
      actions.createOrder(order, personality, settings.minSize);
    });
  }, [actions, hideRunWindow, settings.minSize, personality]);

  const runID = useMemo(() => toRunId(symbol, strategy), [symbol, strategy]);

  const runWindow = (
    <Run
      id={runID}
      symbol={symbol}
      strategy={strategy}
      tenors={tenors}
      onClose={hideRunWindow}
      onCancelOrder={actions.cancelOrder}
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
  const dobColumns = useMemo(() => createTOBColumns(data, true), [data]);
  const tobColumns = useMemo(() => createTOBColumns(data, false), [data]);
  const getDepthTable = (): ReactElement | null => {
    if (state.tenor === null)
      return null;
    const rows: TOBTable = {...state.depths[state.tenor]};
    return <Table scrollable={false}
                  columns={dobColumns}
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
                    setStrategy={(value: string) => actions.setStrategy(value)}
                    setSymbol={(value: string) => actions.setSymbol(value)}
                    onClose={props.onClose}
                    onShowRunWindow={showRunWindow}/>
      <div className={'window-content'}>
        <div className={state.tenor === null ? 'visible' : 'invisible'}>
          <Table scrollable={false} columns={tobColumns} rows={rows} renderRow={renderRow}/>
        </div>
        <div className={'depth-table'}>
          {getDepthTable()}
        </div>
      </div>
      <ModalWindow render={renderOrderTicket} visible={state.orderTicket !== null}/>
      <ModalWindow render={renderDarkPoolTicket} visible={state.darkPoolTicket !== null}/>
      <ModalWindow render={() => runWindow} visible={state.runWindowVisible}/>
    </>
  );
});

