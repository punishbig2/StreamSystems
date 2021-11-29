import { RowProps } from "components/MiddleOffice/DealBlotter/row";
import React from "react";
import { isNaN } from "lodash";

interface OwnProps {
  readonly renderRow: (
    props: RowProps,
    index?: number
  ) => React.ReactElement | null;

  readonly [key: string]: any;
}

type Props = React.PropsWithRef<OwnProps>;
enum Actions {
  UpdateGeometry = "UPDATE_GEOMETRY",
  ResetRowCount = "RESET_ROW_COUNT",
  UpdateVisibleRowCount = "UPDATE_VISIBLE_ROW_COUNT",
  UpdateScrollTop = "UPDATE_SCROLL_TOP",
}

interface State {
  readonly contentHeight: number;
  readonly containerHeight: number;
  readonly itemHeight: number;
  readonly visibleRowCount: number;
  readonly firstRow: number;
  readonly top: number;
  readonly bottom: number;
}

const initialState: State = {
  contentHeight: 0,
  containerHeight: 0,
  itemHeight: 0,
  visibleRowCount: Number.MAX_SAFE_INTEGER,
  firstRow: 0,
  top: 0,
  bottom: 0,
};

interface Action {
  readonly type: Actions;
  readonly data: any;
}

const reducer = (state: State, action: Action): State => {
  const { data } = action;
  switch (action.type) {
    case Actions.UpdateScrollTop:
      return {
        ...state,
        firstRow: data.firstRow,
        top: data.top,
        bottom: data.bottom,
      };
    case Actions.UpdateVisibleRowCount:
      return {
        ...state,
        visibleRowCount: data.visibleRowCount,
        bottom: data.bottom,
      };
    case Actions.ResetRowCount:
      return { ...state, visibleRowCount: data };
    case Actions.UpdateGeometry:
      return {
        ...state,
        contentHeight: data.contentHeight,
        containerHeight: data.containerHeight,
        itemHeight: data.itemHeight,
      };
  }
  return state;
};

export const TableBody: React.FC<Props> = React.forwardRef(
  (props: Props, ref: React.Ref<any>): React.ReactElement => {
    const { rows = [] } = props;
    const containerRef = React.useRef<HTMLDivElement>(null);
    const { current } = containerRef;
    const [state, dispatch] = React.useReducer<React.Reducer<State, Action>>(
      reducer,
      initialState
    );

    React.useEffect((): (() => void) | void => {
      if (current === null) {
        return;
      }

      const parent = current.parentElement!;
      const children = Array.from(current.children).map(
        (c) => c as HTMLElement
      );

      const itemHeight =
        children.reduce(
          (tallest: number, next: HTMLElement): number =>
            tallest + next.offsetHeight,
          0
        ) / children.length;

      dispatch({
        type: Actions.UpdateGeometry,
        data: {
          itemHeight: itemHeight,
          containerHeight: parent.offsetHeight,
          contentHeight: parent.scrollHeight,
        },
      });

      const resizeObserver = new ResizeObserver((): void => {
        dispatch({
          type: Actions.UpdateGeometry,
          data: {
            itemHeight: itemHeight,
            containerHeight: parent.offsetHeight,
            contentHeight: parent.scrollHeight,
          },
        });
      });

      resizeObserver.observe(parent);
      return (): void => {
        resizeObserver.disconnect();
      };
    }, [current]);

    React.useEffect((): void => {
      dispatch({
        type: Actions.ResetRowCount,
        data: rows.length,
      });
    }, [rows.length]);

    React.useEffect((): void => {
      const visibleRowCount =
        Math.ceil(state.containerHeight / state.itemHeight) + 1;

      if (!isNaN(visibleRowCount)) {
        dispatch({
          type: Actions.UpdateVisibleRowCount,
          data: {
            visibleRowCount: visibleRowCount,
            bottom: state.contentHeight - visibleRowCount * state.itemHeight,
          },
        });
      }
    }, [state.containerHeight, state.contentHeight, state.itemHeight]);

    if (rows.length === 0) {
      return (
        <div className={"empty-table"}>
          <h1>There's no data yet</h1>
        </div>
      );
    }

    const onScroll = (event: any): void => {
      if (current === null) return;
      const parent = current.parentElement!;
      console.log(parent.scrollTop);

      requestAnimationFrame((): void => {
        dispatch({
          type: Actions.UpdateScrollTop,
          data: {
            firstRow: Math.max(
              Math.ceil(parent.scrollTop / state.itemHeight),
              0
            ),
            top: parent.scrollTop,
            bottom:
              parent.scrollHeight -
              state.visibleRowCount * state.itemHeight -
              parent.scrollTop,
          },
        });
      });
    };

    return (
      <div ref={ref} className={"tbody"} onScroll={onScroll}>
        <div style={{ height: state.top }} />
        <div ref={containerRef}>
          {rows
            .slice(state.firstRow, state.firstRow + state.visibleRowCount)
            .map((data: any): any => {
              const { row } = data;
              const rowProps = {
                ...data,
                selected: row.id === props.selectedRow,
              };
              return props.renderRow(rowProps);
            })}
        </div>
        <div style={{ height: state.bottom }} />
      </div>
    );
  }
);
