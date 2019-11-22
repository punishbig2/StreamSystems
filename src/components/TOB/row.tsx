import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {RowFunctions} from 'components/TOB/rowFunctions';
import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {RowActions} from 'redux/constants/rowConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {createRowReducer} from 'redux/reducers/rowReducer';
import {RowState} from 'redux/stateDefs/rowState';
import {injectNamedReducer, removeNamedReducer} from 'redux/store';
import {percentage} from 'utils';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  weight: number;

  [key: string]: any;
}

type DispatchProps = RowFunctions;

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  setOfrQty: (value: number) => dispatch(createAction($$(id, RowActions.SetOfferQuantity), value)),
  setBidQty: (value: number) => dispatch(createAction($$(id, RowActions.SetBidQuantity), value)),
});

const withRedux: (ignored: any) => any = connect<RowState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<RowState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

const Row = withRedux((props: OwnProps & RowState & DispatchProps) => {
  const {id, columns, row, ...extra} = props;
  // Compute the total weight of the columns
  useEffect(() => {
    injectNamedReducer(id, createRowReducer, {row});
    return () => {
      removeNamedReducer(id);
    };
  }, [id, row]);
  const functions: DispatchProps = {
    setOfrQty: props.setOfrQty,
    setBidQty: props.setBidQty,
  };
  return (
    <div className={'tr'}>
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
