import React, {ReactElement, useEffect, useReducer, Reducer} from 'react';
import {Order, OrderStatus} from 'interfaces/order';
import {OrderTypes} from 'interfaces/mdEntry';
import {Quantity} from 'components/Table/CellRenderers/Quantity';
import {getOrderStatusClass} from 'components/Table/CellRenderers/Price/utils/getOrderStatusClass';
import {Price} from 'components/Table/CellRenderers/Price';
import {STRM} from 'redux/stateDefs/workspaceState';
import {PodTable} from 'interfaces/podTable';
import {AggregatedSz} from 'components/PodTile/reducer';
import {User} from 'interfaces/user';
import {getAuthenticatedUser} from 'utils/getCurrentUser';
import {createOrder, cancelOrder} from 'columns/podColumns/helpers';
import {FXOAction} from 'redux/fxo-action';
import {createAction} from 'redux/actionCreator';
import {getNthParentOf, skipTabIndexAll} from 'utils/skipTab';
import {NavigateDirection} from 'components/NumericInput/navigateDirection';
import {API} from 'API';

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
  onDoubleClick: (type: OrderTypes, data: any) => void;
}
const getAggregatedSize = (aggregatedSize: AggregatedSz | undefined, order: Order): number | null => {
  if (aggregatedSize) {
    const price: number | null = order.price;
    const key: string | null = price === null ? null : price.toFixed(3);
    const index: 'ofr' | 'bid' = ((type: OrderTypes): 'ofr' | 'bid' => {
      switch (type) {
        case OrderTypes.Bid:
          return 'bid';
        case OrderTypes.Ofr:
          return 'ofr';
        default:
          throw new Error('I cannot find aggregated sizes of non orders');
      }
    })(order.type);
    if (aggregatedSize[order.tenor] && key !== null)
      return aggregatedSize[order.tenor][index][key];
    return order.quantity;
  } else {
    return order.quantity;
  }
};

/*const onSubmitHandler = (order: Order, ...args: any[]) => {
  data.onQuantityChange(findMyOrder(order), args[0], args[1], args[2], args[3]);
};*/

const getPriceIfApplies = (order: Order | undefined): number | undefined => {
  if (order === undefined)
    return undefined;
  if ((order.status & OrderStatus.SameBank) !== 0)
    return order.price as number;
  return undefined;
};

const canDoubleClick = (order: Order, personality: string) => {
  const user: User = getAuthenticatedUser();
  if (user.isbroker && personality === STRM)
    return false;
  return order.price !== null && order.quantity !== null;
};

enum ActionTypes {
  SetEditedSize, SetSubmittedSize, ResetAllSizes
}

interface State {
  editedSize: number | null;
  submittedSize: number | null;
}

const toNumberOrFallbackIfNaN = (value: string | null, fallback: number | null) => {
  if (value === null)
    return null;
  const numeric: number = Number(value);
  if (isNaN(numeric))
    return fallback;
  return numeric;
};

const reducer: Reducer<State, FXOAction<ActionTypes>> = (state: State, action: FXOAction<ActionTypes>): State => {
  switch (action.type) {
    case ActionTypes.SetEditedSize:
      return {...state, editedSize: toNumberOrFallbackIfNaN(action.data, state.editedSize)};
    case ActionTypes.SetSubmittedSize:
      return {...state, submittedSize: toNumberOrFallbackIfNaN(action.data, state.submittedSize)};
    case ActionTypes.ResetAllSizes:
      return {...state, editedSize: null, submittedSize: null};
    default:
      return state;
  }
};

export const OrderCellGroup: React.FC<OwnProps> = (props: OwnProps) => {
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
  /*const status: OrderStatus = getChevronStatus(depths, order.tenor, order.type)
    | getBankMatchesPersonalityStatus(order, data.personality)
    | order.status
  ;*/
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
      const quantity: number | null = state.editedSize;
      // Create the order
      createOrder({...order, quantity}, props.depths, props.minimumSize, props.personality);
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
    if (!canDoubleClick(order, props.personality))
      return;
    props.onDoubleClick(order.type, order);
  };

  const onChangeSize = (value: string | null) => dispatch(createAction<ActionTypes>(ActionTypes.SetEditedSize, value));
  const resetSize = () => dispatch(createAction<ActionTypes>(ActionTypes.SetEditedSize, state.submittedSize));
  const onSubmitPrice = async (input: HTMLInputElement, price: number | null, changed: boolean) => {
    if (changed) {
      const quantity: number = getFinalSize();
      // Do not wait for this
      createOrder({...order, price, quantity}, props.depths, props.minimumSize, props.personality);
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

  const onNavigate = (input: HTMLInputElement, direction: NavigateDirection) => {
    switch (direction) {
      case NavigateDirection.Up:
        skipTabIndexAll(input, -5, 'last-row');
        break;
      case NavigateDirection.Left:
        skipTabIndexAll(input, -1);
        break;
      case NavigateDirection.Down:
        skipTabIndexAll(input, 5, 'first-row');
        break;
      case NavigateDirection.Right:
        skipTabIndexAll(input, 1);
        break;
    }
  };

  const readOnly: boolean = props.isBroker && props.personality === STRM;
  const quantity: number | null = (() => {
    if (state.editedSize !== null)
      return state.editedSize;
    if (props.isDepth)
      return order.quantity;
    return getAggregatedSize(props.aggregatedSize, order);
  })();

  const size: ReactElement = (
    <Quantity key={2}
              type={type}
              className={getOrderStatusClass(order.status, 'cell size-layout')}
              value={quantity}
              cancellable={order.isCancellable()}
              readOnly={readOnly}
              onCancel={() => cancelOrder(order, depths)}
              onBlur={resetSize}
              onNavigate={onNavigate}
              onChange={onChangeSize}
              onSubmit={onSubmitSize}/>
  );
  /*
      onSubmit={onSubmit}
      onTabbedOut={data.onTabbedOut}
      onDoubleClick={canDoubleClick(order, data.personality) ? data.onDoubleClick : undefined}
      onError={data.onOrderError}
   */

  const items: ReactElement[] = [
    <Price
      key={1}
      status={order.status}
      value={order.price}
      min={getPriceIfApplies(bid)}
      max={getPriceIfApplies(ofr)}
      className={'pod'}
      readOnly={readOnly}
      arrow={order.arrowDirection}
      onDoubleClick={onDoubleClick}
      onSubmit={onSubmitPrice}
      onNavigate={onNavigate}/>,
  ];
  switch (type) {
    case OrderTypes.Ofr:
      items.push(size);
      break;
    case OrderTypes.Bid:
      items.unshift(size);
  }
  return (
    <div className={'twin-cell'}>
      {items}
    </div>
  );
};
