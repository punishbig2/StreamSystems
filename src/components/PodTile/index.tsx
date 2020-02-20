import createTOBColumns from 'columns/podColumns';
import {ModalWindow} from 'components/ModalWindow';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {createColumnData} from 'components/PodTile/createColumnData';
import {TOBColumnData} from 'components/PodTile/data';
import {useDepthEmitter} from 'components/PodTile/hooks/useDepthEmitter';
import {useInitializer} from 'components/PodTile/hooks/useInitializer';
import {DispatchProps, OwnProps, Props} from 'components/PodTile/props';
import {ActionTypes, reducer, State} from 'components/PodTile/reducer';
import {Row} from 'components/PodTile/Row';
import {PodTileTitle} from 'components/PodTile/title';
import {Order} from 'interfaces/order';
import {PodRow, TOBRowStatus} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import {SettingsContext} from 'main';
import React, {ReactElement, useCallback, useContext, useEffect, useMemo, useReducer} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {createAction, createWindowAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {WindowState} from 'redux/stateDefs/windowState';
import {Settings} from 'settings';
import {setStrategy, setSymbol} from 'redux/actions/podTileActions';
import {PodTileActions} from 'redux/reducers/podTileReducer';
import {Currency} from 'interfaces/currency';
import {WorkspaceState, STRM} from 'redux/stateDefs/workspaceState';
import {API} from 'API';
import {SignalRManager} from 'redux/signalR/signalRManager';

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
      initialize: (rows: { [tenor: string]: PodRow }) =>
        reduxDispatch(createWindowAction(props.workspaceID, id, PodTileActions.Initialize, rows)),
      setStrategy: (value: string) => reduxDispatch(setStrategy(props.workspaceID, id, value)),
      setSymbol: (value: string) => reduxDispatch(setSymbol(props.workspaceID, id, symbols.find((s: Currency) => s.name === value))),
      // updateOrder: (order: Order) => reduxDispatch(updateOrder(id, order)),
      setRowStatus: (order: Order, status: TOBRowStatus) => {
        console.log('set row status ignore');
        // reduxDispatch(setRowStatus(id, order, status))
      },
    }),
    [id],
  );

  // Internal temporary reducer actions
  const setCurrentTenor = useCallback((tenor: string | null) =>
      dispatch(createAction(ActionTypes.SetCurrentTenor, tenor)),
    []);

  const setOrderTicket = useCallback((ticket: Order | null) =>
      dispatch(createAction(ActionTypes.SetOrderTicket, ticket)),
    []);

  const insertDepth = useCallback((data: any) =>
      dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data)),
    []);
  const showRunWindow = useCallback(() => dispatch(createAction(ActionTypes.ShowRunWindow)), []);
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
  useInitializer(tenors, email, actions.initialize);
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

  const bulkCreateOrders = useCallback(
    (entries: Order[]) => {
      // Close the runs window
      hideRunWindow();
      // Create the orders
      entries.forEach((order: Order) => {
        const allMyOrders: Order[] = SignalRManager.getOrdersForUser(user.email);
        const matchingOrder: Order | undefined = allMyOrders.find((other: Order) => {
          return other.uid() === order.uid();
        });
        if (matchingOrder) {
          API.cancelOrder(matchingOrder);
        }
        API.createOrder(order, personality, symbol.minqty);
      });
    },
    [hideRunWindow, user.email, personality, symbol.minqty],
  );

  const runWindow = (): ReactElement | null => {
    return (
      <Run
        visible={state.runWindowVisible}
        symbol={symbol.name}
        strategy={strategy}
        tenors={tenors}
        defaultSize={symbol.defaultqty}
        minimumSize={symbol.minqty}
        onClose={hideRunWindow}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const onRowErrorFn = useCallback(
    (status: TOBRowStatus) => onRowError(status),
    [onRowError],
  );
  const renderRow = (rowProps: any, index?: number): ReactElement => {
    const {symbol, strategy} = props;
    const {row, ...childProps} = rowProps;
    console.log(row, childProps);
    return (
      <Row {...childProps}
           aggregatedSize={state.aggregatedSize}
           personality={props.personality}
           defaultSize={symbol.defaultqty}
           minimumSize={symbol.minqty}
           symbol={symbol.name}
           strategy={strategy}
           tenor={row.tenor}
           depths={state.depths}
           displayOnly={false}
           rowNumber={index}
           connected={props.connected}
           onError={onRowErrorFn}/>
    );
  };
  const renderDOBRow = (rowProps: any): ReactElement => {
    // static
    return (
      <Row {...rowProps} depths={[]} onError={onRowErrorFn} connected={props.connected}/>
    );
  };
  const dobColumns = useMemo(() => createTOBColumns(data, true), [data]);
  const tobColumns = useMemo(() => createTOBColumns(data, false), [data]);
  const getDepthTable = (): ReactElement | null => {
    if (state.tenor === null) return null;
    const rows: PodTable = {...state.depths[state.tenor]};
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
      const depth: PodTable = state.depths[state.tenor];
      const values: PodRow[] = Object.values(depth);
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
      <PodTileTitle
        symbol={symbol.name}
        strategy={strategy}
        symbols={symbols}
        products={products}
        runsDisabled={!symbol || !strategy || (props.personality === STRM && user.isbroker)}
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
        render={runWindow}
        visible={state.runWindowVisible}
      />
    </>
  );
};

const connected = withRedux(PodTile);
export {connected as PodTile};
