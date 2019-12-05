import createColumns from 'columns/run';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {RunActions} from 'components/Run/enumerator';
import {useDeleteAllListener} from 'components/Run/hooks/useDeleteAllListener';
import {useInitializer} from 'components/Run/hooks/useInitializer';
import {useOrderListener} from 'components/Run/hooks/userOrderListener';
import {reducer} from 'components/Run/reducer';
import {Row} from 'components/Run/row';
import {Table} from 'components/Table';
import {EntryTypes} from 'interfaces/mdEntry';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {TOBRow} from 'interfaces/tobRow';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import strings from 'locales';
import React, {ReactElement, useReducer} from 'react';
import {createAction} from 'redux/actionCreator';
import {toRunId} from 'utils';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  toggleOCO: () => void;
  symbol: string;
  strategy: string;
  oco: boolean;
  tenors: string[],
  user: User;
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
}

export {Run};

const Run: React.FC<OwnProps> = (props: OwnProps) => {
  const [state, dispatch] = useReducer(reducer, {orders: {}, history: [], defaultBidQty: 10, defaultOfrQty: 10});
  const {symbol, strategy, tenors, user} = props;
  const {email} = user;

  const setTable = (orders: TOBTable) => dispatch(createAction(RunActions.SetTable, orders));
  // Updates a single side of the depth
  const onUpdate = (order: Order) => {
    const id: string = $$(toRunId(order.symbol, order.strategy), order.tenor);
    switch (order.type) {
      case EntryTypes.Invalid:
        break;
      case EntryTypes.Ofr:
        dispatch(createAction(RunActions.UpdateOffer, {id, entry: order}));
        break;
      case EntryTypes.Bid:
        dispatch(createAction(RunActions.UpdateBid, {id, entry: order}));
        break;
      case EntryTypes.DarkPool:
        break;
    }
  };

  const onDelete = (id: string) => dispatch(createAction(RunActions.RemoveOrder, id));

  useOrderListener(tenors, symbol, strategy, {onUpdate, onDelete});
  useDeleteAllListener(symbol, strategy, Sides.Sell, () => dispatch(createAction(RunActions.RemoveAllOfrs)));
  useDeleteAllListener(symbol, strategy, Sides.Buy, () => dispatch(createAction(RunActions.RemoveAllBids)));
  useInitializer(tenors, symbol, strategy, email, setTable);

  const onSubmit = () => {
    if (state.orders === null)
      return;
    const eligible: OrderStatus = OrderStatus.PriceEdited | OrderStatus.Cancelled;
    const rows: TOBRow[] = Object
      .values(state.orders)
      .filter((row: TOBRow) => {
        const {bid, ofr} = row;
        if (bid.price === null || ofr.price === null)
          return true;
        return bid.price < ofr.price;
      });
    const entries: Order[] = [
      ...rows.map((value: TOBRow) => value.bid),
      ...rows.map((value: TOBRow) => value.ofr),
    ];
    const selected: Order[] = entries
      .filter((entry: Order) => (entry.status & eligible) !== 0)
    ;
    if (selected.length === 0)
      return;
    props.onSubmit(selected);
  };

  if (state.orders === {})
    return (<div>Loading...</div>);

  const renderRow = (props: any): ReactElement | null => {
    const {row} = props;
    return (
      <Row {...props} user={props.user} row={row} defaultBidQty={state.defaultBidQty}
           defaultOfrQty={state.defaultOfrQty}/>
    );
  };

  const getNthParentOf = (element: Element, count: number): Element | null => {
    let parent: Node | null = element.parentNode;
    for (let i = 0; i < count - 1; ++i) {
      if (parent === null)
        return null;
      parent = parent.parentNode;
    }
    return parent as Element;
  };
  const skipTabIndex = (target: HTMLInputElement, n: number) => {
    const parent: Element | null = getNthParentOf(target, 4);
    if (parent !== null) {
      const inputs: HTMLInputElement[] = Array.from(parent.querySelectorAll('input:not([tabindex="-1"])'));
      const startAt: number = inputs.indexOf(target);
      if (startAt === -1)
        return;
      const next: HTMLInputElement = inputs[startAt + n];
      if (!next)
        return;
      // Now just focus the input
      next.focus();
    }
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Bid, {id, value})),
    onOfrChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Ofr, {id, value})),
    onMidChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Mid, {id, value})),
    onSpreadChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.Spread, {id, value})),
    onBidQtyChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.BidQtyChanged, {
      id,
      value,
    })),
    onOfrQtyChanged: (id: string, value: number | null) => dispatch(createAction(RunActions.OfrQtyChanged, {
      id,
      value,
    })),
    defaultBidQty: {
      value: state.defaultBidQty,
      onChange: (value: number) => dispatch(createAction(RunActions.UpdateDefaultBidQty, value)),
      type: EntryTypes.Bid,
    },
    defaultOfrQty: {
      value: state.defaultOfrQty,
      onChange: (value: number) => dispatch(createAction(RunActions.UpdateDefaultOfrQty, value)),
      type: EntryTypes.Ofr,
    },
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          break;
        case NavigateDirection.Left:
          break;
        case NavigateDirection.Down:
          break;
        case NavigateDirection.Right:
          break;
      }
    },
    focusNext: (target: HTMLInputElement, action: RunActions) => {
      switch (action) {
        case RunActions.Bid:
          skipTabIndex(target, 1);
          break;
        case RunActions.Spread:
          skipTabIndex(target, 4);
          break;
        case RunActions.Ofr:
          skipTabIndex(target, 3);
          break;
        case RunActions.Mid:
          skipTabIndex(target, 4);
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
        <div className={'half'}>
          <label>
            <input type={'checkbox'} checked={props.oco} onChange={props.toggleOCO}/><span>OCO</span>
          </label>
        </div>
      </div>
      <Table columns={columns} rows={state.orders} renderRow={renderRow}/>
      <div className={'dialog-buttons'}>
        <button className={'cancel'} onClick={props.onClose}>{strings.Close}</button>
        <button className={'success'} onClick={onSubmit}>{strings.Submit}</button>
      </div>
    </div>
  );
};
