import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {User} from 'interfaces/user';
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
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  user?: User;
}

interface DispatchProps {
  setOfferQuantity: (value: number) => void;
  setOfferPrice: (value: number) => void;
  setBidQuantity: (value: number) => void;
  setBidPrice: (value: number) => void;
}

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({
  setOfferPrice: (value: number) => dispatch(createAction($$(id, RowActions.SetOfferPrice), value)),
  setOfferQuantity: (value: number) => dispatch(createAction($$(id, RowActions.SetOfferQuantity), value)),
  setBidPrice: (value: number) => dispatch(createAction($$(id, RowActions.SetBidPrice), value)),
  setBidQuantity: (value: number) => dispatch(createAction($$(id, RowActions.SetBidQuantity), value)),
});

const withRedux: (ignored: any) => any = connect<RowState, DispatchProps, OwnProps, ApplicationState>(
  dynamicStateMapper<RowState, OwnProps, ApplicationState>(),
  mapDispatchToProps,
);

const Row = withRedux((props: OwnProps & RowState & DispatchProps) => {
  const {id, columns, row, user} = props;
  // Compute the total weight of the createColumns
  const total = columns.reduce((total: number, {weight}: ColumnSpec) => total + weight, 0);
  useEffect(() => {
    injectNamedReducer(id, createRowReducer, {row});
    return () => {
      removeNamedReducer(id);
    };
  }, [id, row]);
  const functions: DispatchProps = {
    setOfferPrice: props.setOfferPrice,
    setOfferQuantity: props.setOfferQuantity,
    setBidPrice: props.setBidPrice,
    setBidQuantity: props.setBidQuantity,
  };
  return (
    <div className={'tr'}>
      {columns.map((column) => {
        const width = 100 * column.weight / total;
        const name = column.name;
        return (
          <Cell key={name} width={width} user={user} render={column.render} {...row} {...functions}/>
        );
      })}
    </div>
  );
});

export {Row};
