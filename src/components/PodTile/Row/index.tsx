import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/PodTile/rowFunctions';
import {PodRowStatus} from 'interfaces/podRow';
import React, {useReducer, Reducer} from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';
import {FXOAction} from 'redux/fxo-action';
import {createAction} from 'redux/actionCreator';
import {createRow} from 'components/PodTile/Row/helpers/emptyRowCreator';
import {State, ActionTypes, reducer} from 'components/PodTile/Row/reducer';
import {useOrderActions} from 'components/PodTile/Row/hooks/useOrderActions';
import {useWListener} from 'components/PodTile/Row/hooks/useWListener';
import {usePropsRowOverwrite} from 'components/PodTile/Row/hooks/usePropsRowOverwrite';
import {useActionDispatcher} from 'hooks/useActionDispatcher';

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
  const {id, columns, row, ...extra} = props;
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

  useActionDispatcher<FXOAction<ActionTypes>>([
    useWListener(symbol, strategy, tenor, connected),
    usePropsRowOverwrite(row),
    useOrderActions(symbol, strategy, tenor, connected, internalRow),
  ], dispatch);

  const onRowStatusChange = (status: PodRowStatus) => {
    dispatch(createAction<ActionTypes>(ActionTypes.SetRowStatus, status));
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
                {...internalRow}/>
        );
      })}
    </div>
  );
};

export {Row};
