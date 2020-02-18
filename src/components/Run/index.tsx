import createColumns from 'columns/run';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import reducer, {RunActions} from 'redux/reducers/runReducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {PodRow, TOBRowStatus} from 'interfaces/podRow';
import {PodTable} from 'interfaces/podTable';
import strings from 'locales';
import React, {ReactElement, useEffect, useCallback} from 'react';
import {toRunId} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {skipTabIndex, skipTabIndexAll} from 'utils/skipTab';
import {$$} from 'utils/stringPaster';
import {connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {RunState} from 'redux/stateDefs/runState';
import {
  updateOfr,
  updateBid,
  removeOrder,
  setTable,
  setOfrPrice,
  setBidPrice,
  setMid,
  setSpread,
  setBidQty,
  setOfrQty,
  setBidDefaultQty,
  setOfrDefaultQty,
  setDefaultSize,
  activateRow,
  onActivateOrder,
  resetOrder,
  deactivateAllOrders,
} from 'redux/actions/runActions';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {Dispatch} from 'redux';
import {compareTenors} from 'utils/dataGenerators';
import {PodTileActions} from 'redux/reducers/podTileReducer';
import {FXOAction} from 'redux/fxo-action';
import {createSymbolStrategyTenorListener} from 'orderEvents';

interface OwnProps {
  id: string;
  symbol: string;
  strategy: string;
  tenors: string[];
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
  minimumSize: number;
  defaultSize: number;
  visible: boolean;
}

interface DispatchProps {
  setDefaultSize: (value: number) => FXOAction<RunActions>;
  updateOfr: (value: any) => FXOAction<RunActions>;
  updateBid: (value: any) => FXOAction<RunActions>;
  removeOrder: (id: string) => FXOAction<RunActions>;
  setTable: (order: PodTable) => FXOAction<RunActions>;
  setBidPrice: (id: string, value: number | null) => FXOAction<RunActions>;
  setOfrPrice: (id: string, value: number | null) => FXOAction<RunActions>;
  setMid: (id: string, value: number | null) => FXOAction<RunActions>;
  setSpread: (id: string, value: number | null) => FXOAction<RunActions>;
  setBidQty: (id: string, value: number | null) => FXOAction<RunActions>;
  setOfrQty: (id: string, value: number | null) => FXOAction<RunActions>;
  setBidDefaultQty: (value: number | null) => FXOAction<RunActions>;
  setOfrDefaultQty: (value: number | null) => FXOAction<RunActions>;
  activateRow: (id: string) => FXOAction<RunActions>;
  onActivateOrder: (rowID: string, orderType: OrderTypes) => FXOAction<RunActions>;
  resetOrder: (rowID: string, orderType: OrderTypes) => FXOAction<RunActions>;
  deactivateAllOrders: () => FXOAction<RunActions>;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps) => {
  const actions: { [key: string]: any } = {
    setDefaultSize: setDefaultSize(id),
    updateOfr: updateOfr(id),
    updateBid: updateBid(id),
    removeOrder: removeOrder(id),
    setTable: setTable(id),
    setOfrPrice: setOfrPrice(id),
    setBidPrice: setBidPrice(id),
    setMid: setMid(id),
    setSpread: setSpread(id),
    setBidQty: setBidQty(id),
    setOfrQty: setOfrQty(id),
    setBidDefaultQty: setBidDefaultQty(id),
    setOfrDefaultQty: setOfrDefaultQty(id),
    activateRow: activateRow(id),
    onActivateOrder: onActivateOrder(id),
    resetOrder: resetOrder(id),
    deactivateAllOrders: deactivateAllOrders(id),
  };
  const entries: [string, any][] = Object.entries(actions);
  return entries.reduce((obj, [name, value]) => {
    return {
      ...obj,
      [name]: (...args: any[]) => {
        dispatch(value(...args));
      },
    };
  }, {}) as DispatchProps;
};

const withRedux = connect(
  dynamicStateMapper<RunState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

type Props = RunState & OwnProps & DispatchProps;

const Run: React.FC<Props> = (props: Props) => {
  const {symbol, strategy, tenors, id} = props;
  const {setDefaultSize, deactivateAllOrders, defaultSize, setTable} = props;
  const setTableWrapper = useCallback((orders: PodTable) => setTable(orders), [setTable]);

  const {updateOfr, updateBid, removeOrder} = props;

  // Updates a single side of the depth
  const onUpdate = useCallback((order: Order) => {
    const id: string = $$(toRunId(order.symbol, order.strategy), order.tenor);
    switch (order.type) {
      case OrderTypes.Invalid:
        break;
      case OrderTypes.Ofr:
        updateOfr({id, order});
        break;
      case OrderTypes.Bid:
        updateBid({id, order});
        break;
      case OrderTypes.DarkPool:
        break;
    }
  }, [updateBid, updateOfr]);

  const onDelete = useCallback((id: string) => removeOrder(id), [removeOrder]);

  let installOrderListeners: (orders: PodTable) => (any[] | (() => void)[]);
  installOrderListeners = useCallback((orders: PodTable) => {
    if (!orders)
      return [];
    const onUpdateWrapper = (order: Order) => {
      if ((order.status & OrderStatus.Cancelled) !== 0 && (order.status & OrderStatus.RunOrder) === 0)
        return;
      onUpdate(order);
    };
    const onDeleteWrapper = (order: Order) => onDelete(order.orderId as string);
    return Object.values(orders)
      .map((row: PodRow) => {
        const {tenor} = row;
        const listeners: (() => void)[] = [
          createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CANCEL', onDeleteWrapper),
          createSymbolStrategyTenorListener(symbol, strategy, tenor, PodTileActions.UpdateOrder, onUpdateWrapper),
        ];
        return () => {
          listeners.forEach((fn: () => void) => fn());
        };
      });
  }, [onDelete, onUpdate, strategy, symbol]);

  const initialize = useCallback((): (() => void)[] => {
    const {email} = getAuthenticatedUser();
    const rows: PodRow[] = tenors.map((tenor: string) => {
      const getEntry = (type: OrderTypes) => {
        return new Order(tenor, symbol, strategy, email, defaultSize, type);
      };
      const bid: Order = getEntry(OrderTypes.Bid);
      const ofr: Order = getEntry(OrderTypes.Ofr);
      return {
        id: $$(toRunId(symbol, strategy), tenor),
        tenor: tenor,
        bid: bid,
        ofr: ofr,
        mid:
          bid.price !== null && ofr.price !== null
            ? (Number(bid.price) + Number(ofr.price)) / 2
            : null,
        spread:
          bid.price !== null && ofr.price !== null
            ? Number(ofr.price) - Number(bid.price)
            : null,
        darkPrice: null,
        status: TOBRowStatus.Normal,
      };
    });
    const table = rows
      .sort(compareTenors)
      .reduce((table: PodTable, row: PodRow) => {
        table[row.id] = row;
        return table;
      }, {});
    setTableWrapper(table);
    setDefaultSize(defaultSize);
    deactivateAllOrders();
    return installOrderListeners(table);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategy, symbol, tenors]);

  useEffect(() => {
    injectNamedReducer(id, reducer);
    const cleaners: (() => void)[] = initialize();
    return () => {
      removeNamedReducer(id);
      cleaners.forEach(fn => fn());
    };
  }, [id, initialize]);

  const activateOrders = (row: PodRow) => {
    props.activateRow(row.id);
  };

  const activateCancelledOrders = () => {
    if (!props.orders)
      return;
    const orders: PodRow[] = Object.values(props.orders);
    orders.forEach(activateOrders);
  };

  const getSelectedOrders = (): Order[] => {
    if (!props.orders)
      return [];
    const rows: PodRow[] = Object.values(props.orders)
      .filter((row: PodRow) => {
        const {bid, ofr} = row;
        if (bid.price === null && ofr.price === null)
          return false;
        if (bid.price === null || ofr.price === null)
          return true;
        return bid.price < ofr.price;
      });
    const ownOrDefaultQty = (order: Order, fallback: number | null): number => {
      const quantityEdited = (order.status & OrderStatus.QuantityEdited) !== 0;
      const canceled = (order.status & OrderStatus.Cancelled) !== 0;
      const preFilled = (order.status & OrderStatus.PreFilled) !== 0;
      if (quantityEdited || (preFilled && !canceled))
        return order.size as number;
      if (canceled && fallback !== props.defaultSize)
        return fallback as number;
      if (fallback === undefined || fallback === null)
        return props.defaultSize;
      return fallback as number;
    };
    const orders: Order[] = [
      ...rows.map(({bid}: PodRow) => ({
        ...bid,
        size: ownOrDefaultQty(bid, props.defaultSize),
      })),
      ...rows.map(({ofr}: PodRow) => ({
        ...ofr,
        size: ownOrDefaultQty(ofr, props.defaultSize),
      })),
    ];
    return orders.filter((order: Order) => {
      if (order.price === null || order.size === null)
        return false;
      return !((order.status & OrderStatus.QuantityEdited) === 0 && (order.status & OrderStatus.PriceEdited) === 0);
    });
  };

  const isSubmitEnabled = () => {
    const selection: Order[] = getSelectedOrders();
    return selection.length > 0;
  };

  const onSubmit = () => {
    props.onSubmit(getSelectedOrders());
  };

  if (props.orders === {})
    return <div>Loading&hellip;</div>;

  const renderRow = (props: any, index?: number): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props}
           user={props.user}
           row={row}
           defaultBidSize={props.defaultBidSize}
           defaultOfrSize={props.defaultOfrSize}
           rowNumber={index}/>
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: (id: string, value: number | null) => props.setBidPrice(id, value),
    onOfrChanged: (id: string, value: number | null) => props.setOfrPrice(id, value),
    onMidChanged: (id: string, value: number | null) => props.setMid(id, value),
    onSpreadChanged: (id: string, value: number | null) => props.setSpread(id, value),
    onBidQtyChanged: (id: string, value: number | null) => props.setBidQty(id, value),
    onOfrQtyChanged: (id: string, value: number | null) => props.setOfrQty(id, value),
    onActivateOrder: (id: string, orderType: OrderTypes) => props.onActivateOrder(id, orderType),
    resetOrder: (id: string, orderType: OrderTypes) => props.resetOrder(id, orderType),
    defaultBidSize: {
      value: props.defaultBidSize,
      onChange: props.setBidDefaultQty,
      type: OrderTypes.Bid,
    },
    defaultOfrSize: {
      value: props.defaultOfrSize,
      onChange: props.setOfrDefaultQty,
      type: OrderTypes.Ofr,
    },
    defaultSize: props.defaultSize,
    minimumSize: props.minimumSize,
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          skipTabIndexAll(target, -6, 'last-row');
          break;
        case NavigateDirection.Left:
          skipTabIndexAll(target, -1);
          break;
        case NavigateDirection.Down:
          skipTabIndexAll(target, 6, 'first-row');
          break;
        case NavigateDirection.Right:
          skipTabIndexAll(target, 1);
          break;
      }
    },
    focusNext: (target: HTMLInputElement, action?: string) => {
      switch (action) {
        case RunActions.Bid:
          skipTabIndex(target, 1, 0);
          break;
        case RunActions.Spread:
          skipTabIndex(target, 4, 3);
          break;
        case RunActions.Ofr:
          skipTabIndex(target, 3, 0);
          break;
        case RunActions.Mid:
          skipTabIndex(target, 4, 2);
          break;
        case '1.size':
          skipTabIndexAll(target, 4, 2);
          break;
        default:
          skipTabIndexAll(target, 1, 0);
          break;
      }
    },
  });

  return (
    <div className={'run-window'}>
      <div className={'modal-title-bar'}>
        <div className={'half'}>
          <div className={'item'}>{props.symbol}</div>
          <div className={'item'}>{props.strategy}</div>
        </div>
      </div>
      <Table scrollable={false} columns={columns} rows={props.orders} renderRow={renderRow}/>
      <div className={'modal-buttons'}>
        <button className={'pull-left'} onClick={activateCancelledOrders}>Activate All</button>
        <div className={'pull-right'}>
          <button className={'cancel'} onClick={props.onClose}>
            {strings.Close}
          </button>
          <button className={'success'} onClick={onSubmit} disabled={!isSubmitEnabled()}>
            {strings.Submit}
          </button>
        </div>
      </div>
    </div>
  );
};

const run = withRedux(Run);
export {run as Run};

