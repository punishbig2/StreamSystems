import { API, Task } from "API";
import createColumns from "columns/run";
import { NavigateDirection } from "components/NumericInput/navigateDirection";
import reducer, { RunActions } from "components/Run/reducer";
import { Row } from "components/Run/row";
import { Table } from "components/Table";
import { BrokerageWidths, Width } from "types/brokerageWidths";
import { BrokerageWidthsResponse } from "types/brokerageWidthsResponse";
import { OrderTypes } from "types/mdEntry";
import { Order } from "types/order";
import { PodRow } from "types/podRow";
import strings from "locales";
import React, {
  ReactElement,
  useEffect,
  useReducer,
  Reducer,
  useState,
} from "react";
import { skipTabIndex, skipTabIndexAll } from "utils/skipTab";
import { RunState } from "stateDefs/runState";
import { useRunInitializer } from "components/Run/hooks/useRunInitializer";
import { createEmptyTable } from "components/Run/helpers/createEmptyTable";
import { getSelectedOrders } from "components/Run/helpers/getSelectedOrders";
import { $$ } from "utils/stringPaster";
import { onPriceChange } from "components/Run/helpers/onPriceChange";
import { TabDirection } from "components/NumericInput";
import { createAction } from "utils/actionCreator";

interface OwnProps {
  visible: boolean;
  symbol: string;
  strategy: string;
  tenors: string[];
  onClose: () => void;
  onSubmit: (entries: Order[]) => void;
  minimumSize: number;
  defaultSize: number;
  orders: { [tenor: string]: Order[] };
}

const initialState: RunState = {
  original: {},
  orders: {},
  defaultOfrSize: 0,
  defaultBidSize: 0,
  isLoading: false,
};

const Run: React.FC<OwnProps> = (props: OwnProps) => {
  const {
    symbol,
    strategy,
    tenors,
    defaultSize,
    minimumSize,
    visible,
    orders: initialOrders,
  } = props;
  const [state, dispatch] = useReducer<Reducer<RunState, RunActions>>(
    reducer,
    initialState
  );
  const [selection, setSelection] = useState<Order[]>([]);
  const [widths, setWidths] = useState<BrokerageWidths>([]);
  const { orders } = state;

  console.log(selection);

  const setSpread = (value: number): void => {
    dispatch(createAction<RunActions>(RunActions.SetSpread, value));
  };

  useEffect(() => {
    const task: Task<BrokerageWidthsResponse> = API.getBrokerageWidths(
      symbol,
      strategy
    );
    const promise: Promise<BrokerageWidthsResponse> = task.execute();
    promise
      .then((response: BrokerageWidthsResponse) => {
        setWidths([
          {
            type: "gold",
            value: response[0].gold,
          },
          {
            type: "silver",
            value: response[0].silver,
          },
          {
            type: "bronze",
            value: response[0].bronze,
          },
        ]);
      })
      .catch((error: any) => {
        console.warn(error);
      });
    return () => task.cancel();
  }, [strategy, symbol]);

  useEffect(() => {
    // Very initial initialization ... this runs even when not visible
    // to pre-populate the table
    dispatch(
      createAction<RunActions>(
        RunActions.SetTable,
        createEmptyTable(symbol, strategy, tenors)
      )
    );
  }, [symbol, strategy, tenors]);

  useRunInitializer(tenors, symbol, strategy, initialOrders, visible, dispatch);
  useEffect(() => {
    dispatch(createAction<RunActions>(RunActions.SetDefaultSize, defaultSize));
  }, [defaultSize, visible]);

  const activateOrders = (row: PodRow) => {
    dispatch(createAction<RunActions>(RunActions.ActivateRow, row.id));
  };

  const activateCancelledOrders = () => {
    if (!orders) return;
    const values: PodRow[] = Object.values(orders);
    values.forEach(activateOrders);
  };

  const defaultBidSize = state.defaultBidSize;
  const defaultOfrSize = state.defaultOfrSize;

  useEffect((): void => {
    setSelection(getSelectedOrders(orders, defaultBidSize, defaultOfrSize));
  }, [orders, defaultBidSize, defaultOfrSize]);

  const isSubmitEnabled = () => {
    return selection.length > 0;
  };

  const onSubmit = () => {
    props.onSubmit(selection);
  };

  const renderRow = (props: any, index?: number): ReactElement | null => {
    const { row } = props;
    return (
      <Row
        {...props}
        user={props.user}
        row={row}
        defaultBidSize={props.defaultBidSize}
        defaultOfrSize={props.defaultOfrSize}
        rowNumber={index}
      />
    );
  };

  // This builds the set of columns of the run depth with it's callbacks
  const columns = createColumns({
    onBidChanged: onPriceChange(dispatch)(orders, OrderTypes.Bid),
    onOfrChanged: onPriceChange(dispatch)(orders, OrderTypes.Ofr),
    onMidChanged: (id: string, value: number | null) =>
      dispatch(
        createAction<RunActions>(RunActions.Mid, {
          id,
          value,
        })
      ),
    onSpreadChanged: (id: string, value: number | null) =>
      dispatch(
        createAction<RunActions>(RunActions.Spread, {
          id,
          value,
        })
      ),
    onBidQtyChanged: (id: string, value: number | null) =>
      dispatch(
        createAction<RunActions>(RunActions.BidSizeChanged, {
          id,
          value,
        })
      ),
    onOfrQtyChanged: (id: string, value: number | null) =>
      dispatch(
        createAction<RunActions>(RunActions.OfrSizeChanged, {
          id,
          value,
        })
      ),
    onActivateOrder: (rowID: string, type: OrderTypes) =>
      dispatch(
        createAction<RunActions>(RunActions.ActivateOrder, {
          rowID,
          type,
        })
      ),
    onDeactivateOrder: (rowID: string, type: OrderTypes) =>
      dispatch(
        createAction<RunActions>(RunActions.DeactivateOrder, {
          rowID,
          type,
        })
      ),
    defaultBidSize: {
      minimum: props.minimumSize,
      value: state.defaultBidSize,
      onSubmit: (input: HTMLInputElement, value: number | null) =>
        dispatch(
          createAction<RunActions>(RunActions.UpdateDefaultBidSize, value)
        ),
      onReset: () =>
        dispatch(
          createAction<RunActions>(
            RunActions.UpdateDefaultBidSize,
            props.defaultSize
          )
        ),
      type: OrderTypes.Bid,
    },
    defaultOfrSize: {
      minimum: props.minimumSize,
      value: state.defaultOfrSize,
      onSubmit: (input: HTMLInputElement, value: number | null) =>
        dispatch(
          createAction<RunActions>(RunActions.UpdateDefaultOfrSize, value)
        ),
      onReset: () =>
        dispatch(
          createAction<RunActions>(
            RunActions.UpdateDefaultOfrSize,
            props.defaultSize
          )
        ),
      type: OrderTypes.Ofr,
    },
    defaultSize: defaultSize,
    minimumSize: minimumSize,
    visible: visible,
    onNavigate: (target: HTMLInputElement, direction: NavigateDirection) => {
      switch (direction) {
        case NavigateDirection.Up:
          skipTabIndexAll(target, -6, "last-row");
          break;
        case NavigateDirection.Left:
          skipTabIndexAll(target, -1);
          break;
        case NavigateDirection.Down:
          skipTabIndexAll(target, 6, "first-row");
          break;
        case NavigateDirection.Right:
          skipTabIndexAll(target, 1);
          break;
      }
    },
    focusNext: (
      target: HTMLInputElement,
      tabDirection: TabDirection,
      action?: string
    ) => {
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
        case $$("1", "size"):
          skipTabIndexAll(target, 4 * tabDirection, 2);
          break;
        default:
          skipTabIndexAll(target, 1 * tabDirection, 0);
          break;
      }
    },
  });

  return (
    <div style={{ minWidth: 500 }}>
      <div className={"modal-title-bar"}>
        <div className={"half"}>
          <div className={"item"}>{props.symbol}</div>
          <div className={"item"}>{props.strategy}</div>
        </div>
        <div className={"commission-rates"}>
          {widths.map((width: Width<any> | undefined): ReactElement | null => {
            if (width === undefined) return null;
            return (
              <button
                key={width.type}
                className={"rate " + width.type}
                onClick={() => setSpread(width.value)}
                type={"button"}
                disabled={state.isLoading}
              >
                {width.value}
              </button>
            );
          })}
        </div>
      </div>
      <Table
        id={`${props.symbol}${props.strategy}-run`}
        scrollable={false}
        columns={columns}
        rows={orders}
        renderRow={renderRow}
        className={(state.isLoading ? "loading" : "") + " run-table"}
      />
      <div className={"modal-buttons"}>
        <button
          className={"cancel pull-left"}
          onClick={activateCancelledOrders}
          disabled={state.isLoading}
        >
          {strings.ActivateAll}
        </button>
        <div className={"pull-right"}>
          <button className={"cancel"} onClick={props.onClose}>
            {strings.Close}
          </button>
          <button
            className={"success"}
            onClick={onSubmit}
            disabled={!isSubmitEnabled()}
          >
            {strings.Submit}
          </button>
        </div>
      </div>
    </div>
  );
};

export { Run };
