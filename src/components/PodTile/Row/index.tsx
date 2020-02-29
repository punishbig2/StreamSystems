import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/PodTile/rowFunctions';
import {PodRowStatus, PodRow} from 'interfaces/podRow';
import React, {useEffect, useReducer, Reducer} from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';
import {W} from 'interfaces/w';
import {SignalRManager} from 'redux/signalR/signalRManager';
import {toPodRow} from 'utils/dataParser';
import {Order, OrderStatus} from 'interfaces/order';
import {FXOAction} from 'redux/fxo-action';
import {createAction} from 'redux/actionCreator';
import {createSymbolStrategyTenorListener, createSymbolStrategySideListener} from 'orderEvents';
import {createRow} from 'components/PodTile/Row/helpers/emptyRowCreator';
import {State, ActionTypes, reducer} from 'components/PodTile/Row/reducer';
import {FXOptionsDB} from 'fx-options-db';
import {$$} from 'utils/stringPaster';
import {Sides} from 'interfaces/sides';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;
  rowNumber: number;
  defaultSize: number;
  minimumSize: number;
  connected: boolean;
  onTenorSelected: (tenor: string) => void;

  [key: string]: any;
}

const Row = (props: OwnProps & RowState & RowFunctions) => {
  const {id, columns, resetStatus, ...extra} = props;
  // Three identifying props
  const {symbol, strategy, tenor, connected} = props;
  // Internal row state
  const initialState: State = {internalRow: createRow(symbol, strategy, tenor)};
  // Internal row reducer
  const [state, dispatch] = useReducer<Reducer<State, FXOAction<ActionTypes>>>(reducer, initialState);
  // Internal row object (it starts as a copy of the original object)
  const {internalRow} = state;
  const {status} = internalRow;

  const classes: string[] = ['tr'];

  const onRowStatusChange = (status: PodRowStatus) => {
    dispatch(createAction<ActionTypes>(ActionTypes.SetRowStatus, status));
  };

  useEffect(() => {
    if (connected) {
      if (!symbol || !strategy || symbol === '' || strategy === '')
        return;
      const signalRManager: SignalRManager = SignalRManager.getInstance();
      const onNewWMessage = async (w: W) => {
        const row: PodRow = toPodRow(w);
        // Update the dark price
        row.darkPrice = await FXOptionsDB.getDarkPool($$(symbol, strategy, tenor));
        // Update us
        dispatch(createAction<ActionTypes>(ActionTypes.SetRow, row));
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

  const functions: RowFunctions = {
    resetStatus: props.resetStatus,
  };

  if (status === PodRowStatus.Executed) {
    classes.push('executed');
  } else if (status !== PodRowStatus.Normal) {
    classes.push('error');
  }

  return (
    <div className={classes.join(' ')} data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const width: string = percentage(column.weight, props.weight);
        const name: string = column.name;
        return (
          <Cell key={name}
                render={column.render}
                width={width}
                colNumber={index}
                onRowStatusChange={onRowStatusChange}
                {...extra}
                {...internalRow}
                {...functions}/>
        );
      })}
    </div>
  );
};

export {Row};
