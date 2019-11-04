import tobColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderEntry} from 'components/OrderEntry';
import {Run} from 'components/Run';
import {Table, TOBHandlers} from 'components/Table';
import {TOBTileTitle} from 'components/TOBTile/title';
import {EntryTypes} from 'interfaces/mdEntry';
import {Product} from 'interfaces/product';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect, useState} from 'react';
import {MosaicBranch, MosaicWindow} from 'react-mosaic-component';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {createOrder} from 'redux/actions/tileActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRActions';
import {TileActions} from 'redux/constants/tileConstants';
import {SignalRAction} from 'redux/signalRAction';
import {TileState} from 'redux/stateDefs/tileState';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  tenors: string[],
  products: Product[];
  symbols: string[];
  user: User;
  path: MosaicBranch[];
  onClose: () => void;
}

export const subscribe = (symbol: string, product: string, tenor: string): SignalRAction<TileActions> => {
  return new SignalRAction(SignalRActions.Subscribe, [symbol, product, tenor]);
};

interface DispatchProps {
  subscribe: (symbol: string, product: string, tenor: string) => void;
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  setProduct: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (entry: TOBEntry, quantity: number) => void;
  updateEntryPrice: (entry: TOBEntry) => void;
  updateEntrySize: (entry: TOBEntry) => void;
}

// FIXME: this could probably be extracted to a generic function
const mapStateToProps: MapStateToProps<TileState, OwnProps, ApplicationState> =
  (state: ApplicationState, ownProps: OwnProps): TileState => {
    const generalizedState = state as any;
    if (generalizedState.hasOwnProperty(ownProps.id)) {
      // Forcing typescript to listen to me >(
      return generalizedState[ownProps.id] as TileState;
    } else {
      return {} as TileState;
    }
  };

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  initialize: (rows: { [tenor: string]: TOBRow }) => dispatch(createAction($$(id, TileActions.Initialize), rows)),
  subscribe: (symbol: string, product: string, tenor: string) => dispatch(subscribe(symbol, product, tenor)),
  setProduct: (value: string) => dispatch(createAction($$(id, TileActions.SetProduct), value)),
  createOrder: (order: TOBEntry, quantity: number) => dispatch(createOrder(order, quantity)),
  setSymbol: (value: string) => dispatch(createAction($$(id, TileActions.SetSymbol), value)),
  toggleOCO: () => dispatch(createAction($$(id, TileActions.ToggleOCO))),
  updateEntryPrice: (entry: TOBEntry) => dispatch(createAction($$(id, TileActions.UpdateEntry), entry)),
  updateEntrySize: (entry: TOBEntry) => dispatch(createAction($$(id, TileActions.UpdateEntry), entry)),
});

const withRedux: (ignored: any) => any = connect<TileState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

type Props = OwnProps & DispatchProps & TileState;

export const TOBTile: React.FC<OwnProps> = withRedux((props: Props): ReactElement => {
  const [orderTicket, setOrderTicket] = useState<TOBEntry | null>(null);
  const [tenor, setTenor] = useState<string | null>(null);
  const [isRunVisible, setRunVisible] = useState<boolean>(false);
  // Extract properties to manage them better
  const {symbols, symbol, products, product, tenors, connected, user} = props;
  const setProduct = ({target: {value}}: { target: HTMLSelectElement }) => props.setProduct(value);
  const setSymbol = ({target: {value}}: { target: HTMLSelectElement }) => props.setSymbol(value);

  // Initialize rows once we have the tenors
  useEffect(() => {
    const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
      object[item.tenor] = item;
      // Return the accumulator
      return object;
    };
    const mapper = (tenor: string): TOBRow => ({
      tenor,
      bid: {firm: user.id, type: EntryTypes.Bid, user: user.id, tenor, symbol, product, price: null, size: null},
      ask: {firm: user.id, type: EntryTypes.Ask, user: user.id, tenor, symbol, product, price: null, size: null},
    });
    const rows: TOBTable = tenors.map(mapper)
      .reduce<TOBTable>(reducer, {} as TOBTable);
    // Initialize this
    props.initialize(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenors]);

  // Subscribe all the tenors for the given pair
  useEffect(() => {
    if (!connected || symbol === '' || product === '')
      return;
    tenors
      .filter((tenor: string) => tenor === '1W') // FIXME: do not filter please
      .forEach((tenor: string) => {
        // This is here because javascript is super stupid and `connected' can change
        // while we're subscribing combinations.
        //
        // Ideally, we should implement the ability to stop
        if (connected) {
          props.subscribe(symbol, product, tenor);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, product, tenors, connected]);

  const handlers: TOBHandlers = {
    onTenorSelected: (value: string) => {
      if (tenor === null) {
        setTenor(value);
      } else {
        setTenor(null);
      }
    },
    onDoubleClick: (type: EntryTypes, entry: TOBEntry) => {
      setOrderTicket(entry);
    },
    onRunButtonClicked: () => {
      setRunVisible(true);
    },
    onRefBidsButtonClicked: () => null,
    onRefOfrsButtonClicked: () => null,
    onPriceChanged: (entry: TOBEntry) => {
      props.updateEntryPrice(entry);
    },
    onSizeChanged: (entry: TOBEntry) => {
      props.updateEntrySize(entry);
    },
  };

  const renderOrderTicket = () => {
    const placeOrder = (quantity: number) => {
      if (orderTicket !== null) {
        props.createOrder(orderTicket, quantity);
        // Remove the internal order ticket
        setOrderTicket(null);
      } else {
        // FIXME: throw an error or something
      }
    };
    return <OrderEntry order={orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={placeOrder}/>;
  };

  const toolbar: ReactElement = (
      <TOBTileTitle
        symbol={symbol}
        product={product}
        symbols={symbols}
        products={products}
        setProduct={setProduct}
        setSymbol={setSymbol}
        onClose={props.onClose}/>
    )
  ;

  const renderRun = () => {
    return (
      <Run
        symbol={symbol}
        product={product}
        toggleOCO={props.toggleOCO}
        oco={props.oco}
        rows={props.rows}
        user={props.user}
        onClose={() => setRunVisible(false)}/>
    );
  };

  const getData = (tenor: string | null): TOBTable | undefined => {
    const {rows} = props;
    if (tenor === null) {
      return rows;
    } else {
      const row: TOBRow = rows[tenor];
      const dob: TOBTable = row.dob ? row.dob : {};
      const missing: TOBTable = {};
      const keys = Object.keys(dob);
      for (let i = 0; i < Object.keys(rows).length - keys.length; ++i) {
        // Fill the missing items in the DOB table
        missing[keys.length + i] = {
          tenor,
          bid: {firm: '', type: EntryTypes.Bid, tenor, symbol, product, user: user.id, price: null, size: null},
          ask: {firm: '', type: EntryTypes.Ask, tenor, symbol, product, user: user.id, price: null, size: null},
        };
      }
      return {...dob, ...missing};
    }
  };

  return (
    <React.Fragment>
      <MosaicWindow<string> title={''} path={props.path} toolbarControls={toolbar}>
        <Table<TOBHandlers> columns={tobColumns} rows={getData(tenor)} handlers={handlers} user={props.user}/>
      </MosaicWindow>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
      <ModalWindow render={renderRun} visible={isRunVisible}/>
    </React.Fragment>
  );
});
