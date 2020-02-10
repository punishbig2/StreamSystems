import createTOBColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {createColumnData} from 'components/PodTile/createColumnData';
import {TOBColumnData} from 'components/PodTile/data';
import {useDepthEmitter} from 'components/PodTile/hooks/useDepthEmitter';
import {useInitializer} from 'components/PodTile/hooks/useInitializer';
import {useSubscriber} from 'components/PodTile/hooks/useSubscriber';
import {DispatchProps, OwnProps, Props} from 'components/PodTile/props';
import {ActionTypes, reducer, State} from 'components/PodTile/reducer';
import {Row} from 'components/PodTile/row';
import {TOBTileTitle} from 'components/PodTile/title';
import {Order, Sides, OrderStatus, DarkPoolOrder} from 'interfaces/order';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {SettingsContext} from 'main';
import React, {ReactElement, useCallback, useContext, useEffect, useMemo, useReducer} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {createAction, createWindowAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {WindowState} from 'redux/stateDefs/windowState';
import {Settings} from 'settings';
import {toRunId} from 'utils';
import {
  subscribe,
  subscribeDarkPool,
  unsubscribe,
  getSnapshot,
  getDarkPoolSnapshot,
  cancelAll,
  updateOrder,
  getRunOrders,
  setRowStatus,
  publishDarkPoolPrice,
  createDarkPoolOrder,
  createOrder,
  cancelOrder,
  setStrategy,
  setSymbol,
  cancelDarkPoolOrder,
} from 'redux/actions/podTileActions';
import {PodTileActions} from 'redux/reducers/podTileReducer';
import {DarkPoolTicket, DarkPoolTicketData} from 'components/DarkPoolTicket';
import {priceFormatter} from 'utils/priceFormatter';
import {Currency} from 'interfaces/currency';
import {WorkspaceState} from 'redux/stateDefs/workspaceState';

const mapStateToProps: MapStateToProps<WindowState, OwnProps, ApplicationState> =
  ({workarea: {workspaces}}: ApplicationState, ownProps: OwnProps) => {
    const {id, workspaceID} = ownProps;
    const workspace: WorkspaceState = workspaces[workspaceID];
    if (!workspace)
      throw new Error('this window does not belong to any workspace');
    return workspace.windows[id];
  };

const withRedux = connect<WindowState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
);

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
  darkPoolTicket: null,
};

const PodTile: React.FC<Props> = (props: Props): ReactElement | null => {
  const {id, dispatch: reduxDispatch} = props;
  const {onRowError} = props;
  const {symbols, symbol, products, strategy, tenors, connected, rows, user, personality} = props;
  const settings = useContext<Settings>(SettingsContext);
  const {email} = props.user;
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions = useMemo(
    () => ({
      initialize: (rows: { [tenor: string]: TOBRow }) =>
        reduxDispatch(createWindowAction(props.workspaceID, id, PodTileActions.Initialize, rows)),
      subscribe: (symbol: string, strategy: string, tenor: string) =>
        reduxDispatch(subscribe(symbol, strategy, tenor)),
      subscribeDarkPool: (symbol: string, strategy: string, tenor: string) =>
        reduxDispatch(subscribeDarkPool(symbol, strategy, tenor)),
      unsubscribe: (symbol: string, strategy: string, tenor: string) =>
        reduxDispatch(unsubscribe(symbol, strategy, tenor)),
      createOrder: (order: Order, personality: string, minSize: number) => {
        return reduxDispatch(createOrder(id, personality, order, minSize));
      },
      setStrategy: (value: string) => reduxDispatch(setStrategy(props.workspaceID, id, value)),
      setSymbol: (value: string) => reduxDispatch(setSymbol(props.workspaceID, id, symbols.find((s: Currency) => s.name === value))),
      cancelOrder: (order: Order) => reduxDispatch(cancelOrder(id, order)),
      getSnapshot: (symbol: string, strategy: string, tenor: string) =>
        reduxDispatch(getSnapshot(id, symbol, strategy, tenor)),
      getDarkPoolSnapshot: (
        symbol: string,
        strategy: string,
        tenor: string,
      ) => reduxDispatch(getDarkPoolSnapshot(id, symbol, strategy, tenor)),
      getRunOrders: (symbol: string, strategy: string) =>
        reduxDispatch(getRunOrders(id, symbol, strategy)),
      cancelAll: (symbol: string, strategy: string, side: Sides) =>
        reduxDispatch(cancelAll(id, symbol, strategy, side)),
      updateOrder: (order: Order) => reduxDispatch(updateOrder(id, order)),
      setRowStatus: (order: Order, status: TOBRowStatus) =>
        reduxDispatch(setRowStatus(id, order, status)),
      publishDarkPoolPrice: (
        symbol: string,
        strategy: string,
        tenor: string,
        price: number,
      ) =>
        reduxDispatch(
          publishDarkPoolPrice(id, symbol, strategy, tenor, price),
        ),
      onDarkPoolDoubleClicked: (
        tenor: string,
        price: number,
        currentOrder: Order | null,
      ) =>
        setDarkPoolTicket({
          tenor,
          price,
          currentOrder,
        }),
      createDarkPoolOrder: (order: DarkPoolOrder, personality: string) =>
        reduxDispatch(createDarkPoolOrder(order, personality)),
      cancelDarkPoolOrder: (order: Order) =>
        reduxDispatch(cancelDarkPoolOrder(id, order)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, reduxDispatch],
  );

  // Internal temporary reducer actions
  const setCurrentTenor = useCallback(
    (tenor: string | null) =>
      dispatch(createAction(ActionTypes.SetCurrentTenor, tenor)),
    [],
  );
  const setOrderTicket = useCallback(
    (ticket: Order | null) =>
      dispatch(createAction(ActionTypes.SetOrderTicket, ticket)),
    [],
  );
  const setDarkPoolTicket = useCallback(
    (price: DarkPoolTicketData | null) =>
      dispatch(createAction(ActionTypes.SetDarkPoolTicket, price)),
    [],
  );
  const insertDepth = useCallback(
    (data: any) =>
      dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data)),
    [],
  );
  const showRunWindow = useCallback(
    () => dispatch(createAction(ActionTypes.ShowRunWindow)),
    [],
  );
  const hideRunWindow = useCallback(
    () => dispatch(createAction(ActionTypes.HideRunWindow)),
    [],
  );

  const {setWindowTitle} = props;
  useEffect(() => {
    if (setWindowTitle && !!symbol && !!strategy) {
      setWindowTitle(props.id, `${symbol} ${strategy}`);
    }
  }, [props.id, symbol, strategy, setWindowTitle]);
  // Create depths for each tenor
  useDepthEmitter(tenors, symbol.name, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(tenors, symbol.name, strategy, email, actions.initialize);
  // Subscribe to signal-r
  useSubscriber(
    rows,
    connected,
    symbol.name,
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
      symbol.name,
      strategy,
      user,
      setCurrentTenor,
      setOrderTicket,
      settings,
      personality,
      symbol.defaultqty,
      symbol.minqty,
    );
  }, [
    actions,
    symbol,
    strategy,
    state,
    settings,
    setCurrentTenor,
    setOrderTicket,
    user,
    personality,
  ]);
  const renderDarkPoolTicket = () => {
    if (state.darkPoolTicket === null) return <div/>;
    const ticket: DarkPoolTicketData = state.darkPoolTicket;
    const onSubmit = (order: DarkPoolOrder) => {
      if (ticket.currentOrder !== null) {
        const order: Order = ticket.currentOrder;
        if ((order.status & OrderStatus.Owned) !== 0) {
          actions.cancelDarkPoolOrder(ticket.currentOrder);
        }
      }
      actions.createDarkPoolOrder(order, personality);
      setDarkPoolTicket(null);
    };
    const {defaultSize} = data;
    return (
      <DarkPoolTicket
        onSubmit={onSubmit}
        onCancel={() => setDarkPoolTicket(null)}
        price={priceFormatter(ticket.price)}
        quantity={defaultSize.toString()}
        tenor={ticket.tenor}
        strategy={strategy}
        symbol={symbol.name}
        user={user.email}/>
    );
  };

  const renderOrderTicket = () => {
    if (state.orderTicket === null) return <div/>;
    const onSubmit = (order: Order) => {
      actions.createOrder(order, personality, symbol.minqty);
      // Remove the internal order ticket
      setOrderTicket(null);
    };
    return (
      <OrderTicket
        order={state.orderTicket}
        onCancel={() => setOrderTicket(null)}
        onSubmit={onSubmit}/>
    );
  };

  const bulkCreateOrders = useCallback(
    (entries: Order[]) => {
      // Close the runs window
      hideRunWindow();
      // Create the orders
      entries.forEach((order: Order) => {
        if (
          (order.status & OrderStatus.PreFilled) !== 0 ||
          (order.status & OrderStatus.Active) !== 0
        ) {
          actions.cancelOrder(order);
        }
        actions.createOrder(order, personality, symbol.minqty);
      });
    },
    [actions, hideRunWindow, symbol, personality],
  );

  const runID = useMemo(() => toRunId(symbol.name, strategy), [symbol, strategy]);
  const runWindow = (): ReactElement | null => {
    return (
      <Run
        id={runID}
        visible={state.runWindowVisible}
        symbol={symbol.name}
        strategy={strategy}
        tenors={tenors}
        onClose={hideRunWindow}
        onSubmit={bulkCreateOrders}
        defaultSize={symbol.defaultqty}
        minSize={symbol.minqty}/>
    );
  };

  const onRowErrorFn = useCallback(
    (status: TOBRowStatus) => onRowError(status),
    [onRowError],
  );
  const renderRow = (rowProps: any, index?: number): ReactElement => {
    const {symbol, strategy} = props;
    return (
      <Row {...rowProps}
           symbol={symbol.name}
           strategy={strategy}
           tenor={rowProps.row.tenor}
           depths={state.depths}
           onError={onRowErrorFn}
           displayOnly={false}
           rowNumber={index}/>
    );
  };
  const renderDOBRow = (props: any): ReactElement => {
    return (
      <Row {...props} depths={[]} onError={onRowErrorFn} displayOnly={true}/>
    );
  };
  const dobColumns = useMemo(() => createTOBColumns(data, true), [data]);
  const tobColumns = useMemo(() => createTOBColumns(data, false), [data]);
  const getDepthTable = (): ReactElement | null => {
    if (state.tenor === null) return null;
    const rows: TOBTable = {...state.depths[state.tenor]};
    return (
      <Table
        scrollable={false}
        columns={dobColumns}
        rows={rows}
        renderRow={renderDOBRow}/>
    );
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
      <TOBTileTitle
        symbol={symbol.name}
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
          <Table
            scrollable={!props.autoSize}
            columns={tobColumns}
            rows={rows}
            renderRow={renderRow}/>
        </div>
        <div className={'depth-table'}>{getDepthTable()}</div>
      </div>
      <ModalWindow
        render={renderOrderTicket}
        visible={state.orderTicket !== null}/>
      <ModalWindow
        render={renderDarkPoolTicket}
        visible={state.darkPoolTicket !== null}/>
      <ModalWindow
        render={runWindow}
        visible={state.runWindowVisible}
      />
    </>
  );
};

const connected = withRedux(PodTile);
export {connected as PodTile};
