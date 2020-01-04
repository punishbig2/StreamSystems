import createColumns from 'columns/run';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {RunActions} from 'components/Run/enumerator';
import {useDeleteAllListener} from 'components/Run/hooks/useDeleteAllListener';
import {useInitializer} from 'components/Run/hooks/useInitializer';
import {useOrderListener} from 'components/Run/hooks/userOrderListener';
import {reducer} from 'components/Run/reducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {OrderTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import strings from 'locales';
import {SettingsContext} from 'main';
import React, {ReactElement, useCallback, useContext, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';
import {Settings} from 'settings';
import {toRunId} from 'utils';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {skipTabIndex, skipTabIndexAll} from 'utils/skipTab';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  symbol: string;
  strategy: string;
  tenors: string[],
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
  onCancelOrder: (order: Order) => void;
}

const Run: React.FC<OwnProps> = (props: OwnProps) => {
  const settings = useContext<Settings>(SettingsContext);
  const [state, dispatch] = useReducer(reducer, {
    orders: {},
    history: {},
    defaultBidSize: settings.defaultSize,
    defaultOfrSize: settings.defaultSize,
    initialized: false,
  });
  const {symbol, strategy, tenors} = props;
  const {email} = getAuthenticatedUser();
  const setTable = (orders: TOBTable) => dispatch(createAction(RunActions.SetTable, orders));
  // Updates a single side of the depth
  const onUpdate = (order: Order) => {
    const id: string = $$(toRunId(order.symbol, order.strategy), order.tenor);
    switch (order.type) {
      case OrderTypes.Invalid:
        break;
      case OrderTypes.Ofr:
        dispatch(createAction(RunActions.UpdateOfr, {id, entry: order}));
        break;
      case OrderTypes.Bid:
        dispatch(createAction(RunActions.UpdateBid, {id, entry: order}));
        break;
      case OrderTypes.DarkPool:
        break;
    }
  };

  const onDelete = (id: string) => dispatch(createAction(RunActions.RemoveOrder, id));
  const onDeleteOfrs = useCallback(() => dispatch(createAction(RunActions.RemoveAllOfrs)), []);
  const onDeleteBids = useCallback(() => dispatch(createAction(RunActions.RemoveAllBids)), []);

  useOrderListener(tenors, symbol, strategy, {onUpdate, onDelete});
  useDeleteAllListener(symbol, strategy, Sides.Sell, onDeleteOfrs);
  useDeleteAllListener(symbol, strategy, Sides.Buy, onDeleteBids);
  useInitializer(tenors, symbol, strategy, email, setTable);

  const getSelectedOrders = (): Order[] => {
    if (state.orders === null || !state.initialized)
      return [];
    const rows: TOBRow[] = Object
      .values(state.orders)
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
      ...rows.map(({bid}: TOBRow) => ({...bid, quantity: ownOrDefaultQty(bid, state.defaultBidSize)})),
      ...rows.map(({ofr}: TOBRow) => ({...ofr, quantity: ownOrDefaultQty(ofr, state.defaultOfrSize)})),
    ];
    return entries
      .filter((order: Order) => {
        if ((order.status & OrderStatus.PriceEdited) !== 0)
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

  if (state.orders === {})
    return (<div>Loading...</div>);

  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props} user={props.user} row={row} defaultBidSize={state.defaultBidSize}
           defaultOfrSize={state.defaultOfrSize}/>
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Bid, {id, value})),
    onOfrChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Ofr, {id, value})),
    onMidChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Mid, {id, value})),
    onSpreadChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Spread, {id, value})),
    onBidQtyChanged: (id: string, value: number | null) => dispatch(
      createAction(RunActions.BidQtyChanged, {
        id,
        value,
      })),
    onCancelOrder: (order: Order) => {
      props.onCancelOrder(order);
    },
    onOfrQtyChanged: (id: string, value: number | null) => dispatch(
      createAction(RunActions.OfrQtyChanged, {
        id,
        value,
      })),
    defaultBidSize: {
      value: state.defaultBidSize,
      onChange: (value: number) => dispatch(createAction(RunActions.UpdateDefaultBidQty, value)),
      type: OrderTypes.Bid,
    },
    defaultOfrSize: {
      value: state.defaultOfrSize,
      onChange: (value: number) => dispatch(createAction(RunActions.UpdateDefaultOfrQty, value)),
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
      <Table scrollable={false} columns={columns} rows={state.orders} renderRow={renderRow}/>
      <div className={'dialog-buttons'}>
        <button className={'cancel'} onClick={props.onClose}>{strings.Close}</button>
        <button className={'success'} onClick={onSubmit} disabled={!isSubmitEnabled()}>{strings.Submit}</button>
      </div>
    </div>
  );
};

export {Run};
