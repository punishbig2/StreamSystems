import createTOBColumns from 'columns/podColumns';
import { ModalWindow } from 'components/ModalWindow';
import { Run } from 'components/Run';
import { Table } from 'components/Table';
import { useDepthEmitter } from 'components/PodTile/hooks/useDepthEmitter';
import { useInitializer } from 'components/PodTile/hooks/useInitializer';
import { ActionTypes, reducer, State } from 'components/PodTile/reducer';
import { Row } from 'components/PodTile/Row';
import { Title } from 'components/PodTile/title';
import { Order } from 'interfaces/order';
import { PodRow } from 'interfaces/podRow';
import { PodTable } from 'interfaces/podTable';
import React, { ReactElement, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { createAction } from 'redux/actionCreator';
import { STRM } from 'redux/stateDefs/workspaceState';
import { API } from 'API';
import { Currency } from 'interfaces/currency';
import { findMyOrder } from 'components/PodTile/helpers';
import { observer } from 'mobx-react';
import { User } from 'interfaces/user';
import { Strategy } from 'interfaces/strategy';
import { InvalidCurrency } from 'redux/stateDefs/windowState';
import { PodTileStore } from 'mobx/stores/podTile';
import { SignalRManager } from 'redux/signalR/signalRManager';

const initialState: State = {
  depths: {},
  tenor: null,
  orderTicket: null,
  runWindowVisible: false,
  darkPoolTicket: null,
};

interface OwnProps {
  id: string;
  workspaceID: string;
  user: User;
  tenors: string[];
  products: Strategy[];
  symbols: Currency[];
  connected: boolean;
  scrollable?: boolean;
  personality: string;
  onClose?: () => void;
}

const getCurrencyFromName = (list: Currency[], name: string): Currency => {
  const found: Currency | undefined = list.find((each: Currency) => each.name === name);
  if (found === undefined)
    return InvalidCurrency;
  return found;
};

const PodTile: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const [store] = useState<PodTileStore>(new PodTileStore(props.id));

  const { workspaceID, id: windowID } = props;
  const { symbols, products, tenors, connected, user, personality } = props;
  const { email } = user;
  const [state, dispatch] = useReducer(reducer, initialState);
  const { strategy } = store;
  const { rows } = store;
  const currency: Currency | undefined = getCurrencyFromName(symbols, store.currency);
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
    const manager: SignalRManager = SignalRManager.getInstance();
    if (currency === InvalidCurrency || !strategy)
      return;
    manager.loadDepth(currency.name, strategy, user);
    store.initialize(currency.name, strategy, user);
  }, [currency, store, strategy, user]);
  // Create depths for each tenor
  useDepthEmitter(tenors, currency.name, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(tenors, user, store.setRows);
  // Handler methods
  const bulkCreateOrders = useCallback(
    (entries: Order[]) => {
      // Close the runs window
      hideRunWindow();
      // Create the orders
      entries.forEach((order: Order) => {
        const myOrder: Order | undefined = findMyOrder(order, user);
        if (myOrder) {
          API.cancelOrder(myOrder, user);
        }
        API.createOrder(order, personality, user, currency.minqty);
      });
    },
    [hideRunWindow, personality, currency.minqty, user],
  );

  const runWindow = (): ReactElement | null => {
    return (
      <Run
        user={user}
        visible={state.runWindowVisible}
        symbol={currency.name}
        strategy={strategy}
        tenors={tenors}
        defaultSize={currency.defaultqty}
        minimumSize={currency.minqty}
        onClose={hideRunWindow}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const renderTobRow = useCallback((rowProps: any, index?: number): ReactElement => {
    const { row } = rowProps;
    return (
      <Row {...rowProps}
           user={user}
           depths={state.depths}
           personality={personality}
           defaultSize={currency.defaultqty}
           minimumSize={currency.minqty}
           currency={currency.name}
           strategy={strategy}
           tenor={row.tenor}
           displayOnly={false}
           rowNumber={index}
           connected={connected}
           onTenorSelected={setCurrentTenor}/>
    );
  }, [user, state.depths, personality, currency, strategy, connected, setCurrentTenor]);

  const renderDOBRow = useCallback((rowProps: any): ReactElement | null => {
    if (!currency || currency.minqty === undefined || currency.defaultqty === undefined || !strategy)
      return null;
    // static
    return (
      <Row {...rowProps}
           user={user}
           depths={[]}
           connected={connected}
           personality={personality}
           defaultSize={currency.defaultqty}
           minimumSize={currency.minqty}
           onTenorSelected={() => setCurrentTenor(null)}/>
    );
  }, [currency, strategy, connected, user, personality, setCurrentTenor]);
  const dobColumns = useMemo(() => createTOBColumns(currency.name, strategy, user, true),
    [strategy, currency.name, user],
  );
  const tobColumns = useMemo(() => createTOBColumns(currency.name, strategy, user, false),
    [strategy, currency.name, user],
  );
  const getDepthTable = (): ReactElement | null => {
    if (state.tenor === null) return null;
    const rows: PodTable = { ...state.depths[state.tenor] };
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
      <Title
        currency={currency.name}
        strategy={strategy}
        symbols={symbols}
        products={products}
        runsDisabled={!currency || !strategy || (props.personality === STRM && user.isbroker)}
        connected={connected}
        onStrategyChange={store.setStrategy}
        onCurrencyChange={store.setCurrency}
        onClose={props.onClose}
        onShowRunWindow={showRunWindow}/>
      <div className={'window-content'}>
        <div className={state.tenor === null ? 'visible' : 'invisible'}>
          <Table scrollable={!!props.scrollable} columns={tobColumns} rows={rows} renderRow={renderTobRow}/>
        </div>
        <div className={'depth-table'}>{getDepthTable()}</div>
      </div>
      <ModalWindow render={runWindow} visible={state.runWindowVisible}/>
    </>
  );
};
const connected = observer(PodTile);

export { connected as PodTile };

