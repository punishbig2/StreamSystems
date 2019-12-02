import createDOBColumns from 'columns/dob';
import createTOBColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {Run} from 'components/Run';
import {Table} from 'components/Table';
import {TOBHandlers} from 'components/TOB/handlers';
import {useDepthEmitter} from 'components/TOB/hooks/useDepthEmitter';
import {useInitializer} from 'components/TOB/hooks/useInitializer';
import {useSubscriber} from 'components/TOB/hooks/useSubscriber';
import {ActionTypes, reducer, State} from 'components/TOB/reducer';
import {Row} from 'components/TOB/row';
import {TOBTileTitle} from 'components/TOB/title';
import {VisibilitySelector} from 'components/visibilitySelector';
import {Currency} from 'interfaces/currency';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect, useReducer, useState} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {
  cancelAll,
  cancelOrder,
  createOrder,
  getRunOrders,
  getSnapshot,
  subscribe,
  updateOrder,
} from 'redux/actions/tobActions';
import {ApplicationState} from 'redux/applicationState';
import {TOBActions} from 'redux/constants/tobConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {RunState} from 'redux/stateDefs/runState';
import {WindowState} from 'redux/stateDefs/windowState';
import {toRunId} from 'utils';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  tenors: string[],
  products: Strategy[];
  symbols: Currency[];
  user: User;
  onClose?: () => void;
}

interface DispatchProps {
  subscribe: (symbol: string, strategy: string, tenor: string) => void;
  getSnapshot: (symbol: string, strategy: string, tenor: string) => void;
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  setStrategy: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (entry: Order) => void;
  cancelOrder: (entry: Order) => void;
  cancelAll: (symbol: string, strategy: string, side: Sides) => void;
  updateOrder: (entry: Order) => void;
  getRunOrders: (symbol: string, strategy: string) => void;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TOBActions.Initialize), rows)),
  subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
  setStrategy: (value: string) => dispatch(createAction($$(id, TOBActions.SetStrategy), value)),
  createOrder: (order: Order) => dispatch(createOrder(id, order)),
  setSymbol: (value: string) => dispatch(createAction($$(id, TOBActions.SetSymbol), value)),
  toggleOCO: () => dispatch(createAction($$(id, TOBActions.ToggleOCO))),
  cancelOrder: (entry: Order) => dispatch(cancelOrder(id, entry)),
  getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(id, symbol, strategy, tenor)),
  cancelAll: (symbol: string, strategy: string, side: Sides) => dispatch(cancelAll(id, symbol, strategy, side)),
  updateOrder: (entry: Order) => dispatch(updateOrder(id, entry)),
  getRunOrders: (symbol: string, strategy: string) => dispatch(getRunOrders(id, symbol, strategy)),
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
  const {email} = props.user;
  // Simple reducer for the element only
  const [state, dispatch] = useReducer(reducer, initialState);
  // Just one value without `dispatch' and stuff
  const [tobVisible, setTobVisible] = useState<boolean>(true);
  // Extract properties to manage them better
  const setProduct = ({target: {value}}: React.ChangeEvent<{ name?: string, value: unknown }>, child: React.ReactNode) => {
    props.setStrategy(value as string);
  };
  const setSymbol = ({target: {value}}: React.ChangeEvent<{ name?: string, value: unknown }>, child: React.ReactNode) => {
    props.setSymbol(value as string);
  };
  // Internal temporary reducer actions
  const setCurrentTenor = (tenor: string | null) => dispatch(createAction(ActionTypes.SetCurrentTenor, tenor));
  const setOrderTicket = (ticket: Order | null) => dispatch(createAction(ActionTypes.SetOrderTicket, ticket));
  const insertDepth = (data: any) => dispatch(createAction<ActionTypes, any>(ActionTypes.InsertDepth, data));
  const showRunWindow = () => dispatch(createAction(ActionTypes.ShowRunWindow));
  const hideRunWindow = () => dispatch(createAction(ActionTypes.HideRunWindow));

  // Create depths for each tenor
  useDepthEmitter(tenors, symbol, strategy, insertDepth);
  // Initialize tile/window
  useInitializer(tenors, symbol, strategy, email, props);
  // Subscribe to signal-r
  useSubscriber(rows, connected, symbol, strategy, subscribe);

  // Handler methods
  const {updateOrder, cancelAll, cancelOrder, createOrder} = props;

  const handlers: TOBHandlers = {
    onUpdateOrder: (entry: Order) => {
      updateOrder(entry);
    },
    onTenorSelected: (tenor: string) => {
      if (state.tenor === null) {
        setCurrentTenor(tenor);
      } else {
        setCurrentTenor(null);
      }
    },
    onDoubleClick: (type: EntryTypes, entry: Order) => {
      setOrderTicket({...entry, type});
    },
    onRunButtonClicked: () => {
      showRunWindow();
    },
    onRefBidsButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Buy);
    },
    onRefOfrsButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Sell);
    },
    onPriceChange: (entry: Order) => {
      // The price was cleared most likely
      if (entry.price === null)
        return;
      if ((entry.status & OrderStatus.Owned) === 0) {
        if (entry.quantity === null) {
          createOrder({...entry, quantity: 10});
        } else {
          createOrder(entry);
        }
      } else {
        if (entry.quantity !== null || entry.price === null)
          return;
        createOrder({...entry, quantity: 10});
      }
    },
    onCancelOrder: (order: Order, cancelRelated: boolean = true) => {
      if (cancelRelated) {
        const rows: TOBRow[] = Object.values(state.depths[order.tenor]);
        rows.forEach((row: TOBRow) => {
          const targetEntry: Order = order.type === EntryTypes.Bid ? row.bid : row.ofr;
          if ((targetEntry.status & OrderStatus.Owned) !== 0) {
            cancelOrder(targetEntry);
          }
        });
      } else {
        cancelOrder(order);
      }
    },
    onQuantityChange: (entry: Order, newQuantity: number) => {
      if (entry.quantity === null)
        return;
      if (entry.quantity > newQuantity) {
        updateOrder({...entry, quantity: newQuantity});
      } else if (entry.quantity < newQuantity) {
        createOrder({...entry, quantity: newQuantity - entry.quantity});
      }
    },
    aggregatedSz: state.aggregatedSz,
  };

  const renderOrderTicket = () => {
    if (state.orderTicket === null)
      return <div/>;
    const onSubmit = (order: Order) => {
      createOrder(order);
      // Remove the internal order ticket
      setOrderTicket(null);
    };
    return <OrderTicket order={state.orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={onSubmit}/>;
  };

  const bulkCreateOrders = (entries: Order[]) => {
    // Close the runs window
    hideRunWindow();
    // Create the orders
    entries.forEach((entry: Order) => props.createOrder(entry));
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
      onSubmit={bulkCreateOrders}/>
  );
  const user = {email};
  const renderRow: (props: any) => ReactElement = (props: any): ReactElement => {
    return (
      <Row {...props} user={user} depths={state.depths}/>
    );
  };
  const getDepthTable = (): ReactElement | null => {
    // @ts-ignore if this function is called `tobVisible' has to be false so for sure this will exist
    return <Table columns={createDOBColumns(handlers)} rows={state.depths[state.tenor]} renderRow={renderRow}/>;
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
    <React.Fragment>
      <TOBTileTitle symbol={symbol} strategy={strategy} symbols={symbols} products={products} setProduct={setProduct}
                    setSymbol={setSymbol} onClose={props.onClose}/>
      <div className={'window-content'}>
        <VisibilitySelector visible={tobVisible}>
          <Table columns={createTOBColumns(handlers)} rows={rows} renderRow={renderRow}/>
        </VisibilitySelector>
        {!tobVisible && getDepthTable()}
      </div>
      <ModalWindow render={renderOrderTicket} visible={state.orderTicket !== null}/>
      <ModalWindow render={runWindow} visible={state.runWindowVisible}/>
    </React.Fragment>
  );
});

