import columns from 'columns/tob';
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
import {EntryTypes} from 'interfaces/mdEntry';
import {Sides} from 'interfaces/order';
import {Strategy} from 'interfaces/strategy';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useReducer} from 'react';
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
  symbols: string[];
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
  createOrder: (entry: TOBEntry) => void;
  cancelOrder: (entry: TOBEntry) => void;
  cancelAll: (symbol: string, strategy: string, side: Sides) => void;
  updateOrder: (entry: TOBEntry) => void;
  getRunOrders: (symbol: string, strategy: string) => void;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TOBActions.Initialize), rows)),
  subscribe: (symbol: string, strategy: string, tenor: string) => dispatch(subscribe(symbol, strategy, tenor)),
  setStrategy: (value: string) => dispatch(createAction($$(id, TOBActions.SetStrategy), value)),
  createOrder: (order: TOBEntry) => dispatch(createOrder(id, order)),
  setSymbol: (value: string) => dispatch(createAction($$(id, TOBActions.SetSymbol), value)),
  toggleOCO: () => dispatch(createAction($$(id, TOBActions.ToggleOCO))),
  cancelOrder: (entry: TOBEntry) => dispatch(cancelOrder(id, entry)),
  getSnapshot: (symbol: string, strategy: string, tenor: string) => dispatch(getSnapshot(id, symbol, strategy, tenor)),
  cancelAll: (symbol: string, strategy: string, side: Sides) => dispatch(cancelAll(id, symbol, strategy, side)),
  updateOrder: (entry: TOBEntry) => dispatch(updateOrder(id, entry)),
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
  // Extract properties to manage them better
  const setProduct = ({target: {value}}: { target: HTMLSelectElement }) => props.setStrategy(value);
  const setSymbol = ({target: {value}}: { target: HTMLSelectElement }) => props.setSymbol(value);
  // Internal temporary reducer actions
  const setCurrentTenor = (tenor: string | null) => dispatch(createAction(ActionTypes.SetCurrentTenor, tenor));
  const setOrderTicket = (ticket: TOBEntry | null) => dispatch(createAction(ActionTypes.SetOrderTicket, ticket));
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
    onUpdateOrder: (entry: TOBEntry) => {
      updateOrder(entry);
    },
    onTenorSelected: (tenor: string) => {
      if (state.tenor === null) {
        if (state.depths[tenor]) {
          // If there's no depth ignore it so that we don't set the tenor
          // and then need 4-click to do it again
          setCurrentTenor(tenor);
        }
      } else {
        setCurrentTenor(null);
      }
    },
    onDoubleClick: (type: EntryTypes, entry: TOBEntry) => {
      console.log(entry);
      setOrderTicket({...entry, type});
    },
    onRunButtonClicked: () => {
      showRunWindow();
    },
    onRefBidsButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Buy);
    },
    onRefOffersButtonClicked: () => {
      cancelAll(symbol, strategy, Sides.Sell);
    },
    onPriceBlur: (entry: TOBEntry) => {
      if (entry.quantity !== null || entry.price === null)
        return;
      createOrder({...entry, quantity: '10'});
    },
    onCancelOrder: (entry: TOBEntry) => {
      cancelOrder(entry);
    },
  };

  const renderOrderTicket = () => {
    if (state.orderTicket === null)
      return <div/>;
    const createOrder = (quantity: number) => {
      const {orderTicket} = state;
      if (orderTicket !== null) {
        props.createOrder({...orderTicket, quantity});
        // Remove the internal order ticket
        setOrderTicket(null);
      } else {
        // FIXME: throw an error or something
      }
    };
    return <OrderTicket order={state.orderTicket}
                        onCancel={() => setOrderTicket(null)}
                        onSubmit={createOrder}/>;
  };

  const bulkCreateOrders = (entries: TOBRow[]) => {
    entries.forEach(({bid, offer}: TOBRow) => {
      if (offer.quantity !== null && offer.price !== null)
        props.createOrder(offer);
      if (bid.quantity !== null && bid.price !== null)
        props.createOrder(bid);
    });
    hideRunWindow();
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
  const renderRow: (props: any) => ReactElement = (props: any): ReactElement => <Row {...props} user={user}/>;
  const getDepthTable = (): ReactElement | null => {
    const currentDepth: TOBTable | undefined = state.tenor !== null ? state.depths[state.tenor] : undefined;
    if (!currentDepth)
      return null;
    return <Table columns={columns(handlers)} rows={currentDepth} renderRow={renderRow}/>;
  };
  return (
    <React.Fragment>
      <TOBTileTitle symbol={symbol} strategy={strategy} symbols={symbols} products={products} setProduct={setProduct}
                    setSymbol={setSymbol} onClose={props.onClose}/>
      <div className={'window-content'}>
        <VisibilitySelector visible={state.tenor === null}>
          <Table columns={columns(handlers)} rows={rows} renderRow={renderRow}/>
        </VisibilitySelector>
        {getDepthTable()}
      </div>
      <ModalWindow render={renderOrderTicket} visible={state.orderTicket !== null}/>
      <ModalWindow render={runWindow} visible={state.runWindowVisible}/>
    </React.Fragment>
  );
});

