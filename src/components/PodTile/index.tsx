import createTOBColumns from 'columns/podColumns';
import { ModalWindow } from 'components/ModalWindow';
import { Run } from 'components/Run';
import { Table } from 'components/Table';
import { useDepthEmitter } from 'components/PodTile/hooks/useDepthEmitter';
import { useInitializer } from 'components/PodTile/hooks/useInitializer';
import { ActionTypes, reducer, State } from 'components/PodTile/reducer';
import { Row } from 'components/PodTile/Row';
import { Order } from 'interfaces/order';
import { PodRow } from 'interfaces/podRow';
import { PodTable } from 'interfaces/podTable';
import React, { ReactElement, useCallback, useEffect, useMemo, useReducer, CSSProperties } from 'react';
import { createAction } from 'redux/actionCreator';
import { API } from 'API';
import { Currency } from 'interfaces/currency';
import { findMyOrder } from 'components/PodTile/helpers';
import { observer } from 'mobx-react';
import { User } from 'interfaces/user';
import { InvalidCurrency } from 'redux/stateDefs/windowState';
import { PodTileStore } from 'mobx/stores/podTile';
import { SignalRManager } from 'redux/signalR/signalRManager';
import { getOptimalWidthFromColumnsSpec } from 'getOptimalWIdthFromColumnsSpec';

const initialState: State = {
  depths: {},
  tenor: null,
};

interface OwnProps {
  id: string;
  store: PodTileStore;
  user: User;
  tenors: string[];
  strategies: string[];
  currencies: Currency[];
  connected: boolean;

  personality: string;

  scrollable?: boolean;
  minimized?: boolean;

  onClose?: () => void;
}

const getCurrencyFromName = (list: Currency[], name: string): Currency => {
  const found: Currency | undefined = list.find((each: Currency) => each.name === name);
  if (found === undefined)
    return InvalidCurrency;
  return found;
};

const PodTile: React.FC<OwnProps> = (props: OwnProps): ReactElement | null => {
  const store: PodTileStore = props.store;

  const { currencies, tenors, connected, user, personality } = props;
  const [state, dispatch] = useReducer(reducer, initialState);
  const { strategy } = store;
  const { rows } = store;
  const currency: Currency | undefined = getCurrencyFromName(currencies, store.currency);

  useEffect(() => {
    store.setCurrency(currency.name);
    store.setStrategy(strategy);
  }, [store, currency, strategy]);

  // Internal temporary reducer actions
  const setCurrentTenor = useCallback((tenor: string | null) =>
      dispatch(createAction(ActionTypes.SetCurrentTenor, tenor)),
    []);

  const insertDepth = useCallback((data: any) =>
      dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data)),
    []);

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
  useInitializer(tenors, currency.name, strategy, user, store.setRows);
  // Handler methods
  const bulkCreateOrders = useCallback(
    (entries: Order[]) => {
      // Close the runs window
      // Create the orders
      Promise.all(
        entries.map(async (order: Order) => {
          const myOrder: Order | undefined = findMyOrder(order, user);
          if (myOrder) {
            await API.cancelOrder(myOrder, user);
          }
          await API.createOrder(order, personality, user, currency.minqty);
        }),
        )
        .then(() => store.hideRunWindow());
    },
    [personality, currency.minqty, user, store],
  );

  const runWindow = (): ReactElement | null => {
    return (
      <Run
        user={user}
        visible={store.isRunWindowVisible}
        symbol={currency.name}
        strategy={strategy}
        tenors={tenors}
        defaultSize={currency.defaultqty}
        minimumSize={currency.minqty}
        onClose={store.hideRunWindow}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const renderToBRow = useCallback((rowProps: any, index?: number): ReactElement => {
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

  const renderDoBRow = useCallback((rowProps: any): ReactElement | null => {
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

  const getWindowContent = () => {
    if (props.minimized) {
      const style: CSSProperties = {
        width: getOptimalWidthFromColumnsSpec(tobColumns),
        height: 1, // We need a minimal height or else it wont be rendered at all
      };
      return <div style={style}/>;
    }
    const dobRows = !!state.tenor ? { ...state.depths[state.tenor] } : {};
    return (
      <div className={'pod-tile-content'}>
        <div className={'pod'} data-showing-tenor={!!state.tenor}>
          <Table scrollable={!!props.scrollable} columns={tobColumns} rows={rows} renderRow={renderToBRow}/>
        </div>
        <div className={'dob'} data-showing-tenor={!!state.tenor}>
          <Table scrollable={!!props.scrollable} columns={dobColumns} rows={dobRows} renderRow={renderDoBRow}/>
        </div>
      </div>
    );
  };

  return (
    <>
      {getWindowContent()}
      <ModalWindow render={runWindow} visible={store.isRunWindowVisible}/>
    </>
  );
};

const connected = observer(PodTile);

export { connected as PodTile };

