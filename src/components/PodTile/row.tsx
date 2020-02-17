import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/PodTile/rowFunctions';
import {TOBRowStatus} from 'interfaces/tobRow';
import React, {useEffect, useReducer, Reducer} from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';
import {W} from 'interfaces/w';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {toPodRow} from 'utils/dataParser';
import {Order, OrderStatus} from 'interfaces/order';
import {FXOAction} from 'redux/fxo-action';
import {OrderTypes} from 'interfaces/mdEntry';
import {createAction} from 'redux/actionCreator';
import {createSymbolStrategyTenorListener} from 'orderEvents';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;
  onError: (status: TOBRowStatus) => void;
  displayOnly: boolean;
  rowNumber: number;

  [key: string]: any;
}

interface State {
  internalRow: { [key: string]: any }
}

enum ActionTypes {
  SetRow, ReplaceOrder, StartLoading,
}

const replaceOrder = (state: State, order: Order): State => {
  const {internalRow} = state;
  if (order.type === OrderTypes.Bid) {
    return {...state, internalRow: {...internalRow, bid: order}};
  } else if (order.type === OrderTypes.Ofr) {
    return {...state, internalRow: {...internalRow, ofr: order}};
  } else {
    return state;
  }
};

const reducer = (state: State, action: FXOAction<ActionTypes>): State => {
  const {internalRow} = state;
  const {bid, ofr} = internalRow;
  switch (action.type) {
    case ActionTypes.SetRow:
      return {...state, internalRow: action.data};
    case ActionTypes.ReplaceOrder:
      return replaceOrder(state, action.data);
    case ActionTypes.StartLoading:
      return {
        ...state,
        internalRow: {
          ...internalRow,
          bid: {...bid, status: bid.status | OrderStatus.BeingLoaded},
          ofr: {...ofr, status: ofr.status | OrderStatus.BeingLoaded},
        },
      };
    default:
      return state;
  }
};

const Row = (props: OwnProps & RowState & RowFunctions) => {
  const {id, columns, onError, displayOnly, resetStatus, ...extra} = props;
  // Three identifying props
  const {symbol, strategy, tenor, row} = props;
  const initialState: State = {
    internalRow: row,
  };
  const [state, dispatch] = useReducer<Reducer<State, FXOAction<ActionTypes>>>(reducer, initialState);
  const {internalRow} = state;
  const {status} = internalRow;

  useEffect(() => {
    if (!symbol || !strategy || symbol === '' || strategy === '')
      return;
    const signalRManager: SignalRManager = SignalRManager.getInstance();
    const onNewWMessage = (w: W) => {
      dispatch(createAction<ActionTypes>(ActionTypes.SetRow, toPodRow(w)));
    };
    // Show the loading spinner
    dispatch(createAction<ActionTypes>(ActionTypes.StartLoading));
    // Create an array of "unsubscribe/remove listener" functions
    return signalRManager.addPodRowListener(symbol, strategy, tenor, onNewWMessage);
  }, [symbol, strategy, tenor]);

  useEffect(() => {
    const onNewOrder = (order: Order) => dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, order));
    const onStatusChange = (status: OrderStatus) =>
      (order: Order) => {
        dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, {
          ...order,
          // Update the status before replacing
          status: order.status | status,
        }));
      };
    const listeners = [
      createSymbolStrategyTenorListener(symbol, strategy, tenor, 'UPDATE_SIZE', onNewOrder),
      createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CREATE', onStatusChange(OrderStatus.BeingCreated)),
      createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CREATED', onStatusChange(OrderStatus.JustCreated)),
      createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CANCEL', onStatusChange(OrderStatus.BeingCancelled)),
    ];
    // Return a function that executes all the "unsubscribe/remove listener" functions
    return () => {
      listeners.forEach((cleanup: () => void) => cleanup());
    };
  }, [symbol, strategy, tenor, internalRow]);

  useEffect(() => {
    // If this is changed "for some reason" replace it, I think
    // FIXME: This is not going to be needed later
    console.log('the row property just changed ...');
    dispatch(createAction<ActionTypes>(ActionTypes.SetRow, row));
  }, [row]);

  /*useEffect(() => {
    if (status === TOBRowStatus.Normal) {
      return;
    } else if (status === TOBRowStatus.Executed) {
      const {ofr, bid} = internalRow;
      if (ofr.price === null && bid.price === null) return;
      const timer = setTimeout(() => {
        resetStatus();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      onError(status);
    }
  }, [onError, resetStatus, internalRow, status]);*/
  const functions: RowFunctions = {
    resetStatus: props.resetStatus,
  };
  const classes: string[] = ['tr'];
  if (status === TOBRowStatus.Executed) {
    classes.push('executed');
  } else if (status !== TOBRowStatus.Normal) {
    classes.push('error');
  }
  return (
    <div className={classes.join(' ')} data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const name: string = column.name;
        const width: string = percentage(column.weight, props.weight);
        return (
          <Cell key={name}
                render={column.render}
                width={width}
                colNumber={index}
                {...extra}
                {...internalRow}
                {...functions}/>
        );
      })}
    </div>
  );
};

export {Row};
