import createTOBColumns from 'columns/podColumns';
import {ModalWindow} from 'components/ModalWindow';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {useDepthEmitter} from 'components/PodTile/hooks/useDepthEmitter';
import {useInitializer} from 'components/PodTile/hooks/useInitializer';
import {OwnProps, Props, DispatchProps} from 'components/PodTile/props';
import {ActionTypes, reducer, State} from 'components/PodTile/reducer';
import {Row} from 'components/PodTile/Row';
import {PodTileTitle} from 'components/PodTile/title';
import {Order} from 'interfaces/order';
import {PodRow} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import React, {ReactElement, useCallback, useEffect, useMemo, useReducer} from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {WindowState} from 'redux/stateDefs/windowState';
import {initialize, setStrategy, setSymbol} from 'redux/actions/podTileActions';
import {WorkspaceState, STRM} from 'redux/stateDefs/workspaceState';
import {API} from 'API';
import {Currency} from 'interfaces/currency';
import {findMyOrder} from 'components/PodTile/helpers';

const mapStateToProps: MapStateToProps<WindowState, OwnProps, ApplicationState> =
  ({workarea: {workspaces}}: ApplicationState, ownProps: OwnProps) => {
    const {id, workspaceID} = ownProps;
    const workspace: WorkspaceState = workspaces[workspaceID];
    if (!workspace)
      throw new Error('this window does not belong to any workspace');
    return workspace.windows[id];
  };

const mapDispatchToProps: DispatchProps = {
  initialize,
  setStrategy,
  setSymbol,
};

const withRedux = connect<WindowState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
  darkPoolTicket: null,
};

const PodTile: React.FC<Props> = (props: Props): ReactElement | null => {
  const {workspaceID, id: windowID} = props;
  const {symbols, symbol, products, strategy, tenors, connected, rows, user, personality} = props;
  const {onTitleChange} = props;
  const {email} = props.user;
  const [state, dispatch] = useReducer(reducer, initialState);

  // Internal temporary reducer actions
  const setCurrentTenor = useCallback((tenor: string | null) =>
      dispatch(createAction(ActionTypes.SetCurrentTenor, tenor)),
    []);

  const insertDepth = useCallback((data: any) =>
      dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data)),
    []);

  const showRunWindow = useCallback(() => dispatch(createAction(ActionTypes.ShowRunWindow)), []);
  const hideRunWindow = useCallback(
    () => dispatch(createAction(ActionTypes.HideRunWindow)),
    [],
  );
  useEffect(() => {
    if (!symbol.name || symbol.name === '' || !strategy || strategy === '') {
      onTitleChange(windowID, 'POD');
    } else {
      onTitleChange(windowID, `${symbol.name} ${strategy}`);
    }
  }, [symbol, strategy, onTitleChange, windowID]);

  // Create depths for each tenor
  useDepthEmitter(tenors, symbol.name, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(workspaceID, windowID, tenors, email, props.initialize);
  // Handler methods
  const bulkCreateOrders = useCallback(
    (entries: Order[]) => {
      // Close the runs window
      hideRunWindow();
      // Create the orders
      entries.forEach((order: Order) => {
        const myOrder: Order | undefined = findMyOrder(order);
        if (myOrder) {
          API.cancelOrder(myOrder);
        }
        API.createOrder(order, personality, symbol.minqty);
      });
    },
    [hideRunWindow, personality, symbol.minqty],
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

  const renderTobRow = useCallback((rowProps: any, index?: number): ReactElement => {
    const {row, ...childProps} = rowProps;
    return (
      <Row {...childProps}
           isBroker={user.isbroker}
           depths={state.depths}
           personality={personality}
           defaultSize={symbol.defaultqty}
           minimumSize={symbol.minqty}
           symbol={symbol.name}
           strategy={strategy}
           tenor={row.tenor}
           displayOnly={false}
           rowNumber={index}
           connected={connected}
           onTenorSelected={setCurrentTenor}/>
    );
  }, [user, state.depths, personality, symbol, strategy, connected, setCurrentTenor]);

  const renderDOBRow = (rowProps: any): ReactElement => {
    // static
    return (
      <Row {...rowProps} depths={[]} connected={props.connected} onTenorSelected={() => setCurrentTenor(null)}/>
    );
  };
  const dobColumns = useMemo(() => createTOBColumns(symbol.name, strategy, user.isbroker, true),
    [strategy, symbol.name, user],
  );
  const tobColumns = useMemo(() => createTOBColumns(symbol.name, strategy, user.isbroker, false),
    [strategy, symbol.name, user],
  );
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
  const setStrategy = (value: string) => {
    props.setStrategy(workspaceID, windowID, value);
  };
  const setSymbol = (value: string) => {
    const currency: Currency | undefined = symbols.find((currency: Currency) => currency.name === value);
    if (currency !== undefined) {
      props.setSymbol(workspaceID, windowID, currency);
    }
  };
  return (
    <>
      <PodTileTitle
        symbol={symbol.name}
        strategy={strategy}
        symbols={symbols}
        products={products}
        runsDisabled={!symbol || !strategy || (props.personality === STRM && user.isbroker)}
        connected={connected}
        setStrategy={setStrategy}
        setSymbol={setSymbol}
        onClose={props.onClose}
        onShowRunWindow={showRunWindow}/>
      <div className={'window-content'}>
        <div className={state.tenor === null ? 'visible' : 'invisible'}>
          <Table
            scrollable={!props.autoSize}
            columns={tobColumns}
            rows={rows}
            renderRow={renderTobRow}/>
        </div>
        <div className={'depth-table'}>{getDepthTable()}</div>
      </div>
      <ModalWindow render={runWindow} visible={state.runWindowVisible}/>
    </>
  );
};
const connected = withRedux(PodTile);

export {connected as PodTile};

