import tobColumns from 'columns/tob';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
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
import {createOrder, getSnapshot} from 'redux/actions/tileActions';
import {ApplicationState} from 'redux/applicationState';
import {SignalRActions} from 'redux/constants/signalRConstants';
import {TileActions} from 'redux/constants/tileConstants';
import {createRowReducer} from 'redux/reducers/tobRowReducer';
import {SignalRAction} from 'redux/signalRAction';
import {TileState} from 'redux/stateDefs/tileState';
import {injectNamedReducer} from 'redux/store';
import {$$} from 'utils/stringPaster';

const emptyOffer = (tenor: string, symbol: string, product: string, user: string): TOBEntry => {
  return {firm: '', type: EntryTypes.Ask, tenor, symbol, product, user, price: null, size: null, quantity: 10};
};

const emptyBid = (tenor: string, symbol: string, product: string, user: string): TOBEntry => {
  return {firm: '', type: EntryTypes.Bid, tenor, symbol, product, user, price: null, size: null, quantity: 10};
};

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
  getSnapshot: (symbol: string, product: string, tenor: string) => void;
  initialize: (rows: { [tenor: string]: TOBRow }) => void;
  setProduct: (value: string) => void;
  setSymbol: (value: string) => void;
  toggleOCO: () => void;
  createOrder: (entry: TOBEntry, quantity: number) => void;
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
  getSnapshot: (symbol: string, product: string, tenor: string) => dispatch(getSnapshot(symbol, product, tenor)),
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
  // Subscribe all the tenors for the given pair
  useEffect(() => {
    if (!connected || symbol === '' || product === '')
      return;
    const reducer = (object: TOBTable, item: TOBRow): TOBTable => {
      object[item.id] = item;
      // Return the accumulator
      return object;
    };
    const tenorToNumber = (value: string) => {
      // FIXME: probably search the number boundary
      const multiplier: number = Number(value.substr(0, 1));
      const unit: string = value.substr(1);
      switch (unit) {
        case 'W':
          return multiplier;
        case 'M':
          return 5 * multiplier;
        case 'Y':
          return 60 * multiplier;
      }
      return 0;
    };
    const rows: TOBRow[] = tenors.map((tenor: string) => {
      // This is here because javascript is super stupid and `connected' can change
      // while we're subscribing combinations.
      //
      // Ideally, we should implement the ability to stop
      if (connected) {
        const id: string = $$(tenor, symbol, product);
        const row: TOBRow = {
          tenor: tenor,
          id: id,
          bid: emptyBid(tenor, symbol, product, user.id),
          darkPool: '',
          offer: emptyOffer(tenor, symbol, product, user.id),
          dob: undefined,
          mid: null,
          spread: null,
        };
        // Return row
        return row;
      }
      return {} as TOBRow;
    }).sort((a: TOBRow, b: TOBRow) => {
      const at: string = a.tenor;
      const bt: string = b.tenor;
      return tenorToNumber(at) - tenorToNumber(bt);
    });
    rows.forEach((row: TOBRow) => {
      // Get snapshot W
      props.getSnapshot(symbol, product, row.tenor);
      // Listen to websocket incoming messages
      props.subscribe(symbol, product, row.tenor);
      // Inject a new reducer
      injectNamedReducer(row.id, createRowReducer, {data: row});
    });
    // Initialize with base rows
    props.initialize(rows.reduce(reducer, {}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, product, tenors, connected]);

  const handlers: TOBHandlers = {
    onOrderPlaced: (entry: TOBEntry, price: number) => {
      if (entry.quantity) {
        props.createOrder({...entry, price}, entry.quantity);
      }
    },
    onTenorSelected: (value: string) => {
      if (tenor === null) {
        setTenor(value);
      } else {
        setTenor(null);
      }
    },
    onDoubleClick: (type: EntryTypes, entry: TOBEntry) => {
      if (entry.type === EntryTypes.Ask) {
        setOrderTicket(entry);
      } else {
        setOrderTicket(entry);
      }
    },
    onRunButtonClicked: () => {
      setRunVisible(true);
    },
    onRefBidsButtonClicked: () => null,
    onRefOffersButtonClicked: () => null,
    onPriceChanged: (entry: TOBEntry) => {
      // FIXME: dispatch the action?
      // props.updateEntryPrice(entry);
    },
    onSizeChanged: (entry: TOBEntry) => {
      // FIXME: dispatch the action?
      // props.updateEntrySize(entry);
    },
    onOfferCanceled: (offer: TOBEntry) => {
      console.log(offer);
    },
    onBidCanceled: (bid: TOBEntry) => {
      console.log(bid);
    },
  };

  const renderOrderTicket = () => {
    if (orderTicket === null)
      return <div/>;
    const createOrder = (quantity: number) => {
      if (orderTicket !== null) {
        props.createOrder(orderTicket, quantity);
        // Remove the internal order ticket
        setOrderTicket(null);
      } else {
        // FIXME: throw an error or something
      }
    };
    return <OrderTicket order={orderTicket} onCancel={() => setOrderTicket(null)} onSubmit={createOrder}/>;
  };

  const bulkCreateOrders = (entries: TOBRow[]) => {
    entries.forEach(({bid, offer}: TOBRow) => {
      props.createOrder(bid, bid.quantity as number);
      props.createOrder(offer, offer.quantity as number);
    });
    setRunVisible(false);
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
        onClose={() => setRunVisible(false)}
        onSubmit={bulkCreateOrders}/>
    );
  };

  const getData = (tenor: string | null): TOBTable | undefined => {
    const {rows} = props;
    if (tenor === null) {
      return rows;
    } else {
      const rowId: string = $$(tenor, symbol, product);
      const row: TOBRow = rows[rowId];
      const dob: TOBTable = row ? (row.dob ? row.dob : {}) : {};
      const missing: TOBTable = {};
      // Get dob row keys
      const keys = Object.keys(dob);
      for (let i = 0; i < Object.keys(rows).length - keys.length; ++i) {
        // Fill the missing items in the DOB table
        missing[keys.length + i] = {
          tenor: tenor,
          id: tenor,
          offer: emptyOffer(tenor, symbol, product, user.id),
          bid: emptyBid(tenor, symbol, product, user.id),
          spread: null,
          mid: null,
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
