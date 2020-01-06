import createColumns from 'columns/run';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {useDeleteAllListener} from 'components/Run/hooks/useDeleteAllListener';
import {useInitializer} from 'components/Run/hooks/useInitializer';
import {useOrderListener} from 'components/Run/hooks/userOrderListener';
import {RunActions} from 'redux/reducers/runReducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import strings from 'locales';
import React, {ReactElement, useCallback} from 'react';
import {toRunId} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {skipTabIndex, skipTabIndexAll} from 'utils/skipTab';
import {$$} from 'utils/stringPaster';
import {MapStateToProps, connect} from 'react-redux';
import {ApplicationState} from 'redux/applicationState';
import {RunState} from 'redux/stateDefs/runState';
import {
  updateOfr,
  updateBid,
  removeAllOfrs,
  removeAllBids,
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
} from 'redux/actions/runActions';
import {Action} from 'redux/action';

interface OwnProps {
  id: string;
  symbol: string;
  strategy: string;
  tenors: string[],
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
  onCancelOrder: (order: Order) => void;
}

interface DispatchProps {
  updateOfr: (value: any) => Action<RunActions>;
  removeAllOfrs: () => Action<RunActions>;
  updateBid: (value: any) => Action<RunActions>;
  removeAllBids: () => Action<RunActions>;
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
}

const mapStateToProps: MapStateToProps<RunState, OwnProps, ApplicationState> = ({run}: ApplicationState) => run;
const mapDispatchToProps = ({
  updateOfr,
  removeAllOfrs,
  updateBid,
  removeAllBids,
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
});

const withRedux = connect(mapStateToProps, mapDispatchToProps);

type Props = RunState & OwnProps & DispatchProps;

const Run: React.FC<Props> = (props: Props) => {
  const {symbol, strategy, tenors} = props;
  const {email} = getAuthenticatedUser();
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

  const onDelete = (id: string) => props.removeOrder(id);
  const onDeleteOfrs = useCallback(() => props.removeAllOfrs, [props.removeAllOfrs]);
  const onDeleteBids = useCallback(() => props.removeAllBids, [props.removeAllBids]);

  useOrderListener(tenors, symbol, strategy, {onUpdate, onDelete});
  useDeleteAllListener(symbol, strategy, Sides.Sell, onDeleteOfrs);
  useDeleteAllListener(symbol, strategy, Sides.Buy, onDeleteBids);
  useInitializer(tenors, symbol, strategy, email, setTable);

  const getSelectedOrders = (): Order[] => {
    if (props.orders === null || !props.initialized)
      return [];
    const rows: TOBRow[] = Object
      .values(props.orders)
      .filter((row: TOBRow) => {
        const {bid, ofr} = row;
        if (bid.price === null && ofr.price === null)
          return false;
        if (bid.price === null || ofr.price === null)
          return true;
        return bid.price < ofr.price;
      });
    const ownOrDefaultQty = (order: Order, defaultSize: number | null): number => {
      if (((order.status & OrderStatus.QuantityEdited) !== 0 || (order.status & OrderStatus.PreFilled) !== 0) &&
        ((order.status & OrderStatus.Cancelled) === 0))
        return order.quantity as number; // It can never be null, no way
      return defaultSize as number;
    };
    const entries: Order[] = [
      ...rows.map(({bid}: TOBRow) => ({...bid, quantity: ownOrDefaultQty(bid, props.defaultBidSize)})),
      ...rows.map(({ofr}: TOBRow) => ({...ofr, quantity: ownOrDefaultQty(ofr, props.defaultOfrSize)})),
    ];
    return entries
      .filter((order: Order) => {
        if ((order.status & OrderStatus.PriceEdited) !== 0 || (order.status & OrderStatus.QuantityEdited) !== 0)
          return true;
        return (order.status & OrderStatus.Cancelled) !== 0;
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
    return (<div>Loading...</div>);

  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props} user={props.user} row={row} defaultBidSize={props.defaultBidSize}
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
    onOfrQtyChanged: (id: string, value: number | null) => props.setBidQty(id, value),
    onCancelOrder: (order: Order) => props.onCancelOrder(order),
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

  return (
    <div className={'run-window'}>
      <div className={'modal-title-bar'}>
        <div className={'half'}>
          <div className={'item'}>{props.symbol}</div>
          <div className={'item'}>{props.strategy}</div>
        </div>
      </div>
      <Table scrollable={false} columns={columns} rows={props.orders} renderRow={renderRow}/>
      <div className={'dialog-buttons'}>
        <button className={'cancel'} onClick={props.onClose}>{strings.Close}</button>
        <button className={'success'} onClick={onSubmit} disabled={!isSubmitEnabled()}>{strings.Submit}</button>
      </div>
    </div>
  );
};

const run = withRedux(Run);
export {run as Run};
