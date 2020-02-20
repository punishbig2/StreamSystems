import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/PodTile/rowFunctions';
import {TOBRowStatus, PodRow} from 'interfaces/podRow';
import React, {useEffect, useReducer, Reducer} from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';
import {W} from 'interfaces/w';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {toPodRow} from 'utils/dataParser';
import {Order, OrderStatus, Sides} from 'interfaces/order';
import {FXOAction} from 'redux/fxo-action';
import {createAction} from 'redux/actionCreator';
import {createSymbolStrategyTenorListener, createSymbolStrategySideListener} from 'orderEvents';
import {AggregatedSize} from 'components/PodTile/reducer';
import {createRow} from 'components/PodTile/Row/helpers/emptyRowCreator';
import {State, ActionTypes, reducer} from 'components/PodTile/Row/reducer';
import {PodTileActions} from 'redux/reducers/podTileReducer';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;
  onError: (status: TOBRowStatus) => void;
  rowNumber: number;
  aggregatedSize: { [key: string]: AggregatedSize };
  defaultSize: number;
  minimumSize: number;
  connected: boolean;

  [key: string]: any;
}

const Row = (props: OwnProps & RowState & RowFunctions) => {
  const {id, columns, onError, resetStatus, ...extra} = props;
  // Three identifying props
  const {symbol, strategy, tenor, connected} = props;
  const initialState: State = {internalRow: createRow(symbol, strategy, tenor)};
  const [state, dispatch] = useReducer<Reducer<State, FXOAction<ActionTypes>>>(reducer, initialState);
  const {internalRow} = state;
  const {status} = internalRow;

  useEffect(() => {
    if (connected) {
      if (!symbol || !strategy || symbol === '' || strategy === '')
        return;
      const signalRManager: SignalRManager = SignalRManager.getInstance();
      const onNewWMessage = (w: W) => {
        // Update us
        dispatch(createAction<ActionTypes>(ActionTypes.SetRow, toPodRow(w)));
      };
      // Show the loading spinner
      dispatch(createAction<ActionTypes>(ActionTypes.StartLoading));
      // Create an array of "unsubscribe/remove listener" functions
      return signalRManager.addPodRowListener(symbol, strategy, tenor, onNewWMessage);
    }
  }, [symbol, strategy, tenor, connected]);

  useEffect(() => {
    if (props.row) {
      // In case of passing the row statically do this
      dispatch(createAction<ActionTypes>(ActionTypes.SetRow, props.row));
    }
  }, [props.row]);

  useEffect(() => {
    if (connected) {
      const onNewOrder = (order: Order) => {
        dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, order));
      };
      const onStatusChange = (status: OrderStatus) =>
        (order: Order) => {
          dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, {
            ...order,
            status: order.status | status,
          }));
        };
      const setCancelStatus = (order: Order) => {
        if (order.price === null || order.isCancelled() || !order.isOwnedByCurrentUser())
          return;
        dispatch(createAction<ActionTypes>(ActionTypes.ReplaceOrder, {
          ...order,
          status: order.status | OrderStatus.BeingCancelled,
        }));
      };
      const onSellCancelAll = () => setCancelStatus(internalRow.ofr);
      const onBuyCancelAll = () => setCancelStatus(internalRow.bid);
      const listeners = [
        createSymbolStrategySideListener(symbol, strategy, Sides.Sell, 'CANCEL', onSellCancelAll),
        createSymbolStrategySideListener(symbol, strategy, Sides.Buy, 'CANCEL', onBuyCancelAll),
        createSymbolStrategyTenorListener(symbol, strategy, tenor, 'UPDATE_SIZE', onNewOrder),
        createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CREATE', onStatusChange(OrderStatus.BeingCreated)),
        createSymbolStrategyTenorListener(symbol, strategy, tenor, 'CANCEL', onStatusChange(OrderStatus.BeingCancelled)),
      ];
      // Return a function that executes all the "unsubscribe/remove listener" functions
      return () => {
        listeners.forEach((cleanup: () => void) => cleanup());
      };
    }
  }, [symbol, strategy, tenor, connected, internalRow]);

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
