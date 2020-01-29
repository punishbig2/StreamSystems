import createColumns from 'columns/run';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {useInitializer} from 'components/Run/hooks/useInitializer';
import {useOrderListener} from 'components/Run/hooks/userOrderListener';
import reducer, {RunActions} from 'redux/reducers/runReducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import strings from 'locales';
import React, {ReactElement, useEffect} from 'react';
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
} from 'redux/actions/runActions';
import {Action} from 'redux/action';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {Dispatch} from 'redux';

interface OwnProps {
  id: string;
  symbol: string;
  strategy: string;
  tenors: string[];
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
  minSize: number;
  defaultSize: number;
}

interface DispatchProps {
  setDefaultSize: (value: number) => Action<RunActions>;
  updateOfr: (value: any) => Action<RunActions>;
  updateBid: (value: any) => Action<RunActions>;
  removeOrder: (id: string) => Action<RunActions>;
  setTable: (order: TOBTable) => Action<RunActions>;
  setBidPrice: (id: string, value: number | null) => Action<RunActions>;
  setOfrPrice: (id: string, value: number | null) => Action<RunActions>;
  setMid: (id: string, value: number | null) => Action<RunActions>;
  setSpread: (id: string, value: number | null) => Action<RunActions>;
  setBidQty: (id: string, value: number | null) => Action<RunActions>;
  setOfrQty: (id: string, value: number | null) => Action<RunActions>;
  setBidDefaultQty: (value: number) => Action<RunActions>;
  setOfrDefaultQty: (value: number) => Action<RunActions>;
  activateRow: (id: string) => Action<RunActions>;
  onActivateOrder: (rowID: string, orderType: OrderTypes) => Action<RunActions>;
  resetOrder: (rowID: string, orderType: OrderTypes) => Action<RunActions>;
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
  const {email} = getAuthenticatedUser();
  const {setDefaultSize} = props;
  const setTable = (orders: TOBTable) => props.setTable(orders);

  // Updates a single side of the depth
  const onUpdate = (order: Order) => {
    const id: string = $$(toRunId(order.symbol, order.strategy), order.tenor);
    switch (order.type) {
      case OrderTypes.Invalid:
        break;
      case OrderTypes.Ofr:
        props.updateOfr({id, order});
        break;
      case OrderTypes.Bid:
        props.updateBid({id, order});
        break;
      case OrderTypes.DarkPool:
        break;
    }
  };

  useEffect(() => {
    injectNamedReducer(id, reducer);
    // Set default size
    setDefaultSize(props.defaultSize);
    return () => {
      removeNamedReducer(id);
    };
  }, [id, setDefaultSize, props.defaultSize]);

  const onDelete = (id: string) => props.removeOrder(id);

  useOrderListener(tenors, symbol, strategy, {onUpdate, onDelete});
  useInitializer(tenors, symbol, strategy, email, props.defaultSize, setTable);

  const activateOrders = (row: TOBRow) => {
    props.activateRow(row.id);
  };

  const activateCancelledOrders = () => {
    if (!props.orders)
      return;
    const orders: TOBRow[] = Object.values(props.orders);
    orders.forEach(activateOrders);
  };

  const getSelectedOrders = (): Order[] => {
    if (!props.orders)
      return [];
    const rows: TOBRow[] = Object.values(props.orders).filter((row: TOBRow) => {
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
        return order.quantity as number;
      if (canceled && fallback !== props.defaultSize)
        return fallback as number;
      if (fallback === undefined || fallback === null)
        return props.defaultSize;
      return fallback as number;
    };
    const entries: Order[] = [
      ...rows.map(({bid}: TOBRow) => ({
        ...bid,
        quantity: ownOrDefaultQty(bid, props.defaultSize),
      })),
      ...rows.map(({ofr}: TOBRow) => ({
        ...ofr,
        quantity: ownOrDefaultQty(ofr, props.defaultSize),
      })),
    ];
    return entries.filter((order: Order) => {
      return (order.status & OrderStatus.PriceEdited) !== 0 || (order.status & OrderStatus.QuantityEdited) !== 0;
    });
  };

  const isSubmitEnabled = () => {
    const selection: Order[] = getSelectedOrders();
    return selection.length > 0;
  };

  const onSubmit = () => {
    props.onSubmit(getSelectedOrders());
  };

  if (props.orders === {}) return <div>Loading...</div>;

  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props}
           user={props.user}
           row={row}
           defaultBidSize={props.defaultBidSize}
           defaultOfrSize={props.defaultOfrSize}/>
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
      value: props.defaultBidSize || props.defaultSize,
      onChange: props.setBidDefaultQty,
      type: OrderTypes.Bid,
    },
    defaultOfrSize: {
      value: props.defaultOfrSize || props.defaultSize,
      onChange: props.setOfrDefaultQty,
      type: OrderTypes.Ofr,
    },
    defaultSize: props.defaultSize,
    minSize: props.minSize,
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          skipTabIndex(target, -4);
          break;
        case NavigateDirection.Left:
          skipTabIndex(target, -1);
          break;
        case NavigateDirection.Down:
          skipTabIndex(target, 4);
          break;
        case NavigateDirection.Right:
          skipTabIndex(target, 1);
          break;
      }
    },
    focusNext: (target: HTMLInputElement, action?: RunActions) => {
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
        default:
          skipTabIndexAll(target, 1, 0);
          break;
      }
    },
  });

  const onClose = () => {
    // Reset the table so that when it's opened again it's the original
    // one loaded initially
    props.setTable(props.originalOrders);
    props.onClose();
  };

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
          <button className={'cancel'} onClick={onClose}>
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
