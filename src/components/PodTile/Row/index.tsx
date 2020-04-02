import { Cell } from 'components/Table/Cell';
import { ColumnSpec } from 'components/Table/columnSpecification';
import { RowFunctions } from 'components/PodTile/rowFunctions';
import { PodRowStatus } from 'interfaces/podRow';
import React, { useReducer, Reducer, useEffect } from 'react';
import { RowState } from 'redux/stateDefs/rowState';
import { FXOAction } from 'redux/fxo-action';
import { createAction } from 'redux/actionCreator';
import { createRow } from 'components/PodTile/Row/helpers/emptyRowCreator';
import { State, ActionTypes, reducer } from 'components/PodTile/Row/reducer';
import { useOrderActions } from 'components/PodTile/Row/hooks/useOrderActions';
import { useWListener } from 'components/PodTile/Row/hooks/useWListener';
import { usePropsRowOverwrite } from 'components/PodTile/Row/hooks/usePropsRowOverwrite';
import { useActionDispatcher } from 'hooks/useActionDispatcher';

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
  const { id, columns, row, totalWidth, containerWidth, ...rowProps } = props;
  const { user } = rowProps;
  // Three identifying props
  const { currency, strategy, tenor, connected } = props;
  // Internal row state
  const initialState: State = { internalRow: createRow(currency, strategy, tenor) };
  // Internal row reducer
  const [state, dispatch] = useReducer<Reducer<State, FXOAction<ActionTypes>>>(reducer, initialState);
  // Internal row object (it starts as a copy of the original object)
  const { internalRow } = state;
  const { status } = internalRow;
  const classes: string[] = ['tr'];

  useActionDispatcher<FXOAction<ActionTypes>>([
    useWListener(currency, strategy, tenor, user, connected),
    usePropsRowOverwrite(row),
    useOrderActions(currency, strategy, tenor, user, connected, internalRow),
  ], dispatch);

  useEffect(() => {
    if (row === undefined)
      return;
    dispatch(createAction<ActionTypes>(ActionTypes.SetRow, row));
  }, [row]);

  const onRowStatusChange = (status: PodRowStatus) => {
    dispatch(createAction<ActionTypes>(ActionTypes.SetRowStatus, status));
  };

  if (status !== PodRowStatus.Normal) {
    classes.push('error');
  }

  return (
    <div className={classes.join(' ')} data-row-number={props.rowNumber}>
      {columns.map((column: ColumnSpec, index: number) => {
        const width: number = (column.width / totalWidth) * containerWidth;
        const name: string = column.name;
        return (
          <Cell key={name}
                render={column.render}
                width={width}
                colNumber={index}
                onRowStatusChange={onRowStatusChange}
                className={column.className}
                {...rowProps}
                {...internalRow}/>
        );
      })}
    </div>
  );
};

export { Row };
