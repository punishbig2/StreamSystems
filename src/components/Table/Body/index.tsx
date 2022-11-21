import { debounce } from '@material-ui/core';
import { RowProps } from 'components/MiddleOffice/DealBlotter/row';
import { isNaN } from 'lodash';
import React from 'react';

interface OwnProps {
  readonly renderRow: (props: RowProps, index?: number) => React.ReactElement | null;

  readonly [key: string]: any;
}

type Props = React.PropsWithRef<OwnProps>;
enum Actions {
  UpdateGeometry = 'UPDATE_GEOMETRY',
  ResetRowCount = 'RESET_ROW_COUNT',
  UpdateVisibleRowCount = 'UPDATE_VISIBLE_ROW_COUNT',
  UpdateScrollTop = 'UPDATE_SCROLL_TOP',
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
      return { ...state, bottom: data.bottom, top: data.top };
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

export const TableBody: React.FC<Props> = React.forwardRef(function TableBody(
  props: Props,
  ref: React.Ref<any>
): React.ReactElement {
  const { rows = [] } = props;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { current } = containerRef;
  const [state, dispatch] = React.useReducer<React.Reducer<State, Action>>(reducer, initialState);

  React.useEffect((): VoidFunction | void => {
    if (current === null) {
      return;
    }

    const parent = current.parentElement;
    if (parent === null) {
      return;
    }

    const children = Array.from(current.children).map((c) => c as HTMLElement);
    const getHeight = (element: HTMLElement): number => element.getBoundingClientRect().height;

    const itemHeight =
      children.reduce(
        (tallest: number, next: HTMLElement): number => tallest + getHeight(next),
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
    const visibleRowCount = Math.min(state.visibleRowCount, rows.length);
    dispatch({
      type: Actions.ResetRowCount,
      data: {
        top: state.firstRow * state.itemHeight,
        bottom: (rows.length - state.firstRow - visibleRowCount) * state.itemHeight,
      },
    });
  }, [rows.length, state.firstRow, state.itemHeight, state.visibleRowCount]);

  React.useEffect((): void => {
    const visibleRowCount = Math.ceil(state.containerHeight / state.itemHeight) + 1;

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
      <div className="empty-table">
        <h1>There&apos;s no data yet</h1>
      </div>
    );
  }

  const onScroll = (): void => {
    if (current === null) {
      return;
    }

    const parent = current.parentElement;
    if (parent === null) {
      return;
    }

    const firstRow = Math.min(
      Math.max(Math.floor(parent.scrollTop / state.itemHeight), 0),
      rows.length - state.visibleRowCount
    );

    if (isNaN(firstRow)) {
      return;
    }

    const bottom = (rows.length - firstRow - state.visibleRowCount) * state.itemHeight;
    if (isNaN(bottom)) {
      return;
    }

    dispatch({
      type: Actions.UpdateScrollTop,
      data: {
        firstRow: firstRow,
        top: firstRow * state.itemHeight,
        bottom: bottom,
      },
    });
  };

  return (
    <div ref={ref} className="tbody" onScroll={debounce(onScroll, 5)}>
      <div style={{ height: state.top }} />
      <div ref={containerRef}>
        {rows
          .slice(state.firstRow, state.firstRow + (state.visibleRowCount ?? rows.length))
          .map((data: any, index: number): any => {
            const { row } = data;
            const rowProps = {
              ...data,
              selected: row.id === props.selectedRow,
            };
            return props.renderRow(rowProps, index);
          })}
      </div>
      <div style={{ height: isNaN(state.bottom) ? 0 : state.bottom }} />
    </div>
  );
});
