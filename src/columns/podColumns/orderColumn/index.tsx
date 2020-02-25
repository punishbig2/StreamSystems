import React, {ReactElement, useEffect, useReducer, Reducer, useState} from 'react';
import {Order, OrderStatus} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Price} from 'components/Table/CellRenderers/Price';
import {STRM} from 'redux/stateDefs/workspaceState';
import {PodTable} from 'interfaces/podTable';
import {createOrder, cancelOrder, onNavigate} from 'columns/podColumns/helpers';
import {FXOAction} from 'redux/fxo-action';
import {createAction} from 'redux/actionCreator';
import {getNthParentOf, skipTabIndexAll} from 'utils/skipTab';
import {API} from 'API';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {ModalWindow} from 'components/ModalWindow';
import {OrderTicket} from 'components/OrderTicket';
import {getAggregatedSize} from 'columns/podColumns/orderColumn/helpers/getAggregatedSize';
import {shouldOpenOrderTicket} from 'columns/podColumns/orderColumn/helpers/shoulOpenOrderTicket';
import {reducer, State, ActionTypes} from 'columns/podColumns/orderColumn/reducer';
import {getChevronStatus, getBankMatchesPersonalityStatus} from 'columns/podColumns/common';
import {PodRowStatus} from 'interfaces/podRow';
import {SignalRManager} from 'redux/signalR/signalRManager';

type OwnProps = {
  depths: { [key: string]: PodTable };
  ofr: Order;
  bid: Order;
  type: OrderTypes;
  aggregatedSize: any;
  isBroker: boolean;
  personality: string;
  isDepth: boolean;
  minimumSize: number;
  defaultSize: number;
}

const getPriceIfApplies = (order: Order | undefined): number | undefined => {
  if (order === undefined)
    return undefined;
  if ((order.status & OrderStatus.SameBank) !== 0)
    return order.price as number;
  return undefined;
};

export const OrderColumn: React.FC<OwnProps> = (props: OwnProps) => {
  const [orderTicket, setOrderTicket] = useState<any>(null);
  const {depths, type} = props;
  const initialState: State = {
    submittedSize: null,
    editedSize: null,
  };
  const [state, dispatch] = useReducer<Reducer<State, FXOAction<ActionTypes>>>(reducer, initialState);

  const order: Order = (() => {
    switch (type) {
      case OrderTypes.Invalid:
      case OrderTypes.DarkPool:
        throw new Error('cannot have a non order kind of price cell');
      case OrderTypes.Ofr:
        return props.ofr;
      case OrderTypes.Bid:
        return props.bid;
    }
  })();

  useEffect(() => {
    dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
  }, [order]);

  const bid: Order | undefined = type === OrderTypes.Bid ? props.bid : undefined;
  const ofr: Order | undefined = type === OrderTypes.Ofr ? props.ofr : undefined;
  const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type)
    | getBankMatchesPersonalityStatus(order, props.personality)
    | order.status
  ;
  const getFinalSize = (): number => {
    if (state.submittedSize !== null)
      return state.submittedSize;
    return props.defaultSize;
  };

  const onSubmitSize = async (input: HTMLInputElement) => {
    if (order.type === OrderTypes.Ofr && order.price === null) {
      dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
    } else if (order.type === OrderTypes.Bid) {
      dispatch(createAction<ActionTypes>(ActionTypes.SetSubmittedSize, state.editedSize));
    }
    if (order.isOwnedByCurrentUser() && (order.status & OrderStatus.PreFilled) !== 0) {
      // We fist cancel our current order
      await API.cancelOrder(order);
      // Get the desired new size
      const size: number | null = state.editedSize;
      // Create the order
      createOrder({...order, size}, props.depths, props.minimumSize, props.personality);
    }
    // Please wait until the main loop has ran and then
    // move the focus, because otherwise it could happen
    // that the focus is moved BEFORE the edited size
    // value is updated
    setImmediate(() => {
      skipTabIndexAll(input, 1);
    });
  };

  const onDoubleClick = () => {
    if (!shouldOpenOrderTicket(order, props.personality))
      return;
    const type: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    setOrderTicket({...order, type});
  };

  const onChangeSize = (value: string | null) => dispatch(createAction<ActionTypes>(ActionTypes.SetEditedSize, value));
  const resetSize = () => dispatch(createAction<ActionTypes>(ActionTypes.SetEditedSize, state.submittedSize));

  function isValidPrice(price: number | null) {
    const otherType: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    const allOrders: Order[] = SignalRManager.getDepthOfTheBook(order.symbol, order.strategy, order.tenor, otherType);
    return allOrders.every((order: Order) => {
      if (price === null)
        return true;
      if (order.price === null)
        return false;
      if (type === OrderTypes.Bid) {
        return order.price > price;
      } else {
        return order.price < price;
      }
    });
  }

  const onSubmitPrice = async (input: HTMLInputElement, price: number | null, changed: boolean) => {
    if (!isValidPrice(price)) {
      dispatch(createAction<ActionTypes>(ActionTypes.SetRowStatus, PodRowStatus.InvertedMarketsError));
      return;
    }
    if (changed) {
      const size: number = getFinalSize();
      const orders: Order[] = SignalRManager.getDepthOfTheBook(order.symbol, order.strategy, order.tenor, order.type);
      const mine: Order | undefined = orders.find((each: Order) => each.isOwnedByCurrentUser());
      if (mine !== undefined)
        await API.cancelOrder(mine);
      // Do not wait for this
      createOrder({...order, price, size}, props.depths, props.minimumSize, props.personality);
    } else {
      dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
    }
    // Move to the next price
    const parent: HTMLElement | null = getNthParentOf(input, 7);
    if (parent !== null) {
      const inputs: HTMLInputElement[] = Array.from(parent.querySelectorAll('.price-layout input.pod'));
      const index: number = inputs.indexOf(input);
      if (index === -1)
        throw new Error('self has to have a non -1 index, this is crazy');
      const next: HTMLInputElement = ((): HTMLInputElement => {
        if (index === inputs.length - 1) {
          return inputs[0];
        } else {
          return inputs[index + 1];
        }
      })();
      next.focus();
    }
  };

  const readOnly: boolean = props.isBroker && props.personality === STRM;
  const size: number | null = (() => {
    if (state.editedSize !== null)
      return state.editedSize;
    if (props.isDepth)
      return order.size;
    return getAggregatedSize(props.aggregatedSize, order);
  })();

  const sizeCell: ReactElement = (
    <Quantity key={2}
              type={type}
              className={getOrderStatusClass(status, 'cell size-layout')}
              value={size}
              cancellable={(status & OrderStatus.HasMyOrder) !== 0 || (status & OrderStatus.Owned) !== 0}
              readOnly={readOnly}
              chevron={(status & OrderStatus.HasDepth) !== 0}
              onCancel={() => cancelOrder(order, depths)}
              onBlur={resetSize}
              onNavigate={onNavigate}
              onChange={onChangeSize}
              onSubmit={onSubmitSize}/>
  );

  const depthOfTheBookTable = (
    <MiniDOB {...props} rows={getMiniDOBByType(props.depths, order.tenor, order.type)}/>
  );

  const items: ReactElement[] = [
    <Price
      key={1}
      status={status}
      value={order.price}
      min={getPriceIfApplies(bid)}
      max={getPriceIfApplies(ofr)}
      className={'pod'}
      readOnly={readOnly}
      arrow={order.arrowDirection}
      tooltip={() => depthOfTheBookTable}
      onDoubleClick={onDoubleClick}
      onSubmit={onSubmitPrice}
      onNavigate={onNavigate}/>,
  ];
  switch (type) {
    case OrderTypes.Ofr:
      items.push(sizeCell);
      break;
    case OrderTypes.Bid:
      items.unshift(sizeCell);
  }

  const renderOrderTicket = (): ReactElement | null => {
    if (orderTicket === null)
      return null;
    const onSubmit = (order: Order) => {
      createOrder(order, props.depths, props.minimumSize, props.personality);
      // Remove the internal order ticket
      setOrderTicket(null);
    };
    return (
      <OrderTicket
        order={orderTicket}
        onCancel={() => setOrderTicket(null)}
        onSubmit={onSubmit}/>
    );
  };

  return (
    <div className={'twin-cell'}>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
      {items}
    </div>
  );
};
