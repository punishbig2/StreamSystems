import createColumns from 'columns/run';
import { NavigateDirection } from 'components/NumericInput/navigateDirection';
import reducer, { RunActions } from 'components/Run/reducer';
import { Row } from 'components/Run/row';
import { Table } from 'components/Table';
import { OrderTypes } from 'interfaces/mdEntry';
import { Order } from 'interfaces/order';
import { PodRow } from 'interfaces/podRow';
import strings from 'locales';
import React, { ReactElement, useEffect, useReducer, Reducer } from 'react';
import { skipTabIndex, skipTabIndexAll } from 'utils/skipTab';
import { RunState } from 'redux/stateDefs/runState';
import { FXOAction } from 'redux/fxo-action';
import { createAction } from 'redux/actionCreator';
import { useRunInitializer } from 'components/Run/hooks/useRunInitializer';
import { createEmptyTable } from 'components/Run/helpers/createEmptyTablei';
import { getSelectedOrders } from 'components/Run/helpers/getSelectedOrders';
import { $$ } from 'utils/stringPaster';
import { onPriceChange } from 'components/Run/helpers/onPriceChange';
import { TabDirection } from 'components/NumericInput';
import { User } from 'interfaces/user';

interface OwnProps {
  visible: boolean;
  symbol: string;
  strategy: string;
  tenors: string[];
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
  minimumSize: number;
  defaultSize: number;
  user: User;
  depth: { [tenor: string]: Order[] };
}

const initialState: RunState = {
  original: {},
  orders: {},
  defaultOfrSize: 0,
  defaultBidSize: 0,
  isLoading: false,
};

const Run: React.FC<OwnProps> = (props: OwnProps) => {
  const { symbol, strategy, tenors, user, defaultSize, minimumSize, visible, depth } = props;
  const [state, dispatch] = useReducer<Reducer<RunState, FXOAction<RunActions>>>(reducer, initialState);
  const { orders } = state;

  useEffect(() => {
    // Very initial initialization ... this runs even when not visible
    // to pre-populate the table
    dispatch(createAction<RunActions>(RunActions.SetTable, createEmptyTable(symbol, strategy, tenors)));
  }, [symbol, strategy, tenors]);

  useRunInitializer(tenors, symbol, strategy, depth, visible, user, dispatch);
  useEffect(() => {
    dispatch(createAction<RunActions>(RunActions.SetDefaultSize, defaultSize));
  }, [defaultSize, visible]);

  const activateOrders = (row: PodRow) => {
    dispatch(createAction<RunActions>(RunActions.ActivateRow, row.id));
  };

  const activateCancelledOrders = () => {
    if (!orders)
      return;
    const values: PodRow[] = Object.values(orders);
    values.forEach(activateOrders);
  };

  const isSubmitEnabled = () => {
    const selection: Order[] = getSelectedOrders(orders, defaultSize);
    // Check if selection is not empty
    return selection.length > 0;
  };

  const onSubmit = () => {
    props.onSubmit(getSelectedOrders(orders, defaultSize));
  };

  const renderRow = (props: any, index?: number): ReactElement | null => {
    const { row } = props;
    return (
      <Row {...props}
           user={props.user}
           row={row}
           defaultBidSize={props.defaultBidSize}
           defaultOfrSize={props.defaultOfrSize}
           rowNumber={index}/>
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: onPriceChange(dispatch)(orders, OrderTypes.Bid),
    onOfrChanged: onPriceChange(dispatch)(orders, OrderTypes.Ofr),
    onMidChanged: (id: string, value: number | null) => dispatch(createAction<RunActions>(RunActions.Mid, {
      id,
      value,
    })),
    onSpreadChanged: (id: string, value: number | null) => dispatch(createAction<RunActions>(RunActions.Spread, {
      id,
      value,
    })),
    onBidQtyChanged: (id: string, value: number | null) => dispatch(createAction<RunActions>(RunActions.BidSizeChanged, {
      id,
      value,
    })),
    onOfrQtyChanged: (id: string, value: number | null) => dispatch(createAction<RunActions>(RunActions.OfrSizeChanged, {
      id,
      value,
    })),
    onActivateOrder: (rowID: string, type: OrderTypes) => dispatch(createAction<RunActions>(RunActions.ActivateOrder, {
      rowID,
      type,
    })),
    onDeactivateOrder: (rowID: string, type: OrderTypes) => dispatch(createAction<RunActions>(RunActions.DeactivateOrder, {
      rowID,
      type,
    })),
    defaultBidSize: {
      minimum: props.minimumSize,
      value: state.defaultBidSize,
      onSubmit: (input: HTMLInputElement, value: number | null) =>
        dispatch(createAction<RunActions>(RunActions.UpdateDefaultBidSize, value)),
      onReset: () => dispatch(createAction<RunActions>(RunActions.UpdateDefaultBidSize, props.defaultSize)),
      type: OrderTypes.Bid,
    },
    defaultOfrSize: {
      minimum: props.minimumSize,
      value: state.defaultOfrSize,
      onSubmit: (input: HTMLInputElement, value: number | null) =>
        dispatch(createAction<RunActions>(RunActions.UpdateDefaultOfrSize, value)),
      onReset: () => dispatch(createAction<RunActions>(RunActions.UpdateDefaultOfrSize, props.defaultSize)),
      type: OrderTypes.Ofr,
    },
    defaultSize: defaultSize,
    minimumSize: minimumSize,
    visible: visible,
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          skipTabIndexAll(target, -6, 'last-row');
          break;
        case NavigateDirection.Left:
          skipTabIndexAll(target, -1);
          break;
        case NavigateDirection.Down:
          skipTabIndexAll(target, 6, 'first-row');
          break;
        case NavigateDirection.Right:
          skipTabIndexAll(target, 1);
          break;
      }
    },
    focusNext: (target: HTMLInputElement, tabDirection: TabDirection, action?: string) => {
      switch (action) {
        case RunActions.Bid:
          skipTabIndex(target, 1 * tabDirection, 0);
          break;
        case RunActions.Spread:
          skipTabIndex(target, 4 * tabDirection, 3);
          break;
        case RunActions.Ofr:
          skipTabIndex(target, 3 * tabDirection, 0);
          break;
        case RunActions.Mid:
          skipTabIndex(target, 4 * tabDirection, 2);
          break;
        case $$('1', 'size'):
          skipTabIndexAll(target, 4 * tabDirection, 2);
          break;
        default:
          skipTabIndexAll(target, 1 * tabDirection, 0);
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
      <Table scrollable={false}
             columns={columns}
             rows={orders}
             renderRow={renderRow}
             className={state.isLoading ? 'loading' : ''}/>
      <div className={'modal-buttons'}>
        <button className={'pull-left'} onClick={activateCancelledOrders} disabled={state.isLoading}>
          {strings.ActivateAll}
        </button>
        <div className={'pull-right'}>
          <button className={'cancel'} onClick={props.onClose}>
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

export { Run };

