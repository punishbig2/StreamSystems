import React, {ReactElement, useEffect, useReducer, Reducer, useState} from 'react';
import {Order, OrderStatus} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Price} from 'components/Table/CellRenderers/Price';
import {STRM} from 'redux/stateDefs/workspaceState';
import {PodTable} from 'interfaces/podTable';
import {cancelOrder, onNavigate} from 'components/PodTile/helpers';
import {FXOAction} from 'redux/fxo-action';
import {createAction} from 'redux/actionCreator';
import {MiniDOB} from 'components/Table/CellRenderers/Price/miniDob';
import {getMiniDOBByType} from 'columns/tobMiniDOB';
import {ModalWindow} from 'components/ModalWindow';
import {getAggregatedSize} from 'columns/podColumns/OrderColumn/helpers/getAggregatedSize';
import {shouldOpenOrderTicket} from 'columns/podColumns/OrderColumn/helpers/shoulOpenOrderTicket';
import {reducer, State, ActionTypes} from 'columns/podColumns/OrderColumn/reducer';
import {PodRowStatus} from 'interfaces/podRow';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {onSubmitSizeListener} from 'columns/podColumns/OrderColumn/helpers/onSubmitSize';
import {onSubmitPriceListener} from 'columns/podColumns/OrderColumn/helpers/onSubmitPrice';
import {checkIfShouldShowTooltip} from 'columns/podColumns/OrderColumn/helpers/checkIfShouldShowTooltip';
import {orderTicketRenderer} from 'columns/podColumns/OrderColumn/helpers/orderTicketRenderer';
import {getOrder} from 'columns/podColumns/OrderColumn/helpers/getOrder';
import {ArrowDirection} from 'interfaces/w';

type OwnProps = {
  depths: { [key: string]: PodTable };
  ofr: Order;
  bid: Order;
  type: OrderTypes;
  isBroker: boolean;
  personality: string;
  isDepth: boolean;
  minimumSize: number;
  defaultSize: number;
  onRowStatusChange: (status: PodRowStatus) => void;
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
  const {editedSize, submittedSize} = state;
  const {defaultSize, minimumSize, personality, onRowStatusChange} = props;
  // Create size submission listener
  const order: Order = getOrder(type, props.ofr, props.bid);
  useEffect(() => {
    if (!order)
      return;
    dispatch(createAction<ActionTypes>(ActionTypes.ResetAllSizes));
  }, [order]);
  // FIXME: this should in principle NEVER happen ...
  if (!order)
    return null;
  const depthOfTheBook: PodTable = SignalRManager.getDepthOfTheBook(order.symbol, order.strategy, order.tenor);
  const shouldShowTooltip: boolean = checkIfShouldShowTooltip(depthOfTheBook, type);
  const depthOfTheBookTable = <MiniDOB {...props} rows={getMiniDOBByType(depths, order.tenor, order.type)}/>;
  const onSubmitSize = onSubmitSizeListener(order, editedSize, minimumSize, personality, dispatch, onRowStatusChange);
  const onSubmitPrice = onSubmitPriceListener(order, type, submittedSize, defaultSize, minimumSize, personality, dispatch, onRowStatusChange);
  const renderOrderTicket = orderTicketRenderer(orderTicket, minimumSize, personality, () => setOrderTicket(null));
  const bid: Order | undefined = type === OrderTypes.Bid ? props.bid : undefined;
  const ofr: Order | undefined = type === OrderTypes.Ofr ? props.ofr : undefined;
  const depth: Order[] = SignalRManager.getDepth(order.symbol, order.strategy, order.tenor, order.type)
    .filter((order: Order) => !order.isCancelled());
  const chevronStatus: OrderStatus = ((): OrderStatus => {
    if (props.isDepth)
      return OrderStatus.None;
    return (depth.length > 1 ? OrderStatus.HasDepth : OrderStatus.None)
      | (depth.some((order: Order) => order.isOwnedByCurrentUser()) ? OrderStatus.HasMyOrder : OrderStatus.None)
      | (order.firm === personality ? OrderStatus.SameBank : OrderStatus.None);
  })();
  const status: OrderStatus = chevronStatus | order.status;

  const onDoubleClick = () => {
    if (!shouldOpenOrderTicket(order, props.personality))
      return;
    const type: OrderTypes = order.type === OrderTypes.Bid ? OrderTypes.Ofr : OrderTypes.Bid;
    // Replace the inferred type to create an opposing order
    setOrderTicket({...order, type});
  };

  const onChangeSize = (value: string | null) => dispatch(createAction<ActionTypes>(ActionTypes.SetEditedSize, value));
  const resetSize = () => dispatch(createAction<ActionTypes>(ActionTypes.SetEditedSize, state.submittedSize));

  const readOnly: boolean = props.isBroker && props.personality === STRM;
  const size: number | null = (() => {
    if (state.editedSize !== null)
      return state.editedSize;
    if (props.isDepth)
      return order.size;
    return getAggregatedSize(order);
  })();

  const cancellable: boolean = (status & OrderStatus.Cancelled) === 0 && (
    (status & OrderStatus.HasMyOrder) !== 0 || (status & OrderStatus.Owned) !== 0
  );

  const sizeCell: ReactElement = (
    <Quantity key={2}
              type={type}
              className={getOrderStatusClass(status, 'cell size-layout')}
              value={size}
              cancellable={cancellable}
              readOnly={readOnly}
              chevron={(status & OrderStatus.HasDepth) !== 0}
              onCancel={cancellable ? () => cancelOrder(order) : undefined}
              onBlur={resetSize}
              onNavigate={onNavigate}
              onChange={onChangeSize}
              onSubmit={onSubmitSize}/>
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
      arrow={(status & OrderStatus.HasDepth) ? order.arrowDirection : ArrowDirection.None}
      tooltip={shouldShowTooltip ? () => depthOfTheBookTable : undefined}
      onDoubleClick={onDoubleClick}
      onSubmit={onSubmitPrice}
      onNavigate={onNavigate}/>,
  ];

  // Depending on the type the size cell goes to the left or right
  switch (type) {
    case OrderTypes.Ofr:
      items.push(sizeCell);
      break;
    case OrderTypes.Bid:
      items.unshift(sizeCell);
  }

  return (
    <div className={'twin-cell'}>
      <ModalWindow render={renderOrderTicket} visible={orderTicket !== null}/>
      {items}
    </div>
  );
};

