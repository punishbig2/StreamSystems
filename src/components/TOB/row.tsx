import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/TOB/rowFunctions';
import {TOBRowStatus} from 'interfaces/tobRow';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {createRowReducer, RowActions} from 'redux/reducers/rowReducer';
import {RowState} from 'redux/stateDefs/rowState';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {percentage} from 'utils';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;
  onError: (status: TOBRowStatus) => void;
  displayOnly: boolean;

  [key: string]: any;
}

const cache: { [key: string]: RowFunctions } = {};
const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): RowFunctions => {
  if (!cache[id]) {
    cache[id] = {
      resetStatus: () => dispatch(createAction($$(id, RowActions.ResetStatus))),
    };
  }
  return cache[id];
};

const withRedux: (ignored: any) => any = connect<RowState, RowFunctions, OwnProps, ApplicationState>(
  dynamicStateMapper<RowState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

const Row = withRedux((props: OwnProps & RowState & RowFunctions) => {
  const {id, columns, row, onError, displayOnly, resetStatus, ...extra} = props;
  const {status} = row;
  useEffect(() => {
    if (displayOnly)
      return;
    injectNamedReducer(id, createRowReducer, {row});
    return () => {
      removeNamedReducer(id);
    };
  }, [id, row, displayOnly]);
  useEffect(() => {
    if (status === TOBRowStatus.Normal) {
      return;
    } else if (status === TOBRowStatus.Executed) {
      const {ofr, bid} = row;
      if (ofr.price === null && bid.price === null)
        return;
      const timer = setTimeout(() => {
        resetStatus();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      onError(status);
    }
  }, [onError, resetStatus, row, status]);
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
    <div className={classes.join(' ')}>
      {columns.map((column) => {
        const name: string = column.name;
        const width: string = percentage(column.weight, props.weight);
        return (
          <Cell key={name} render={column.render} width={width} {...extra} {...row} {...functions}/>
        );
      })}
    </div>
  );
});

export {Row};
