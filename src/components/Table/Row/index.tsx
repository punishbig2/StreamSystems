import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Layout} from 'components/Table/Row/layout';
import {User} from 'interfaces/user';
import React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {createAction} from 'redux/actionCreator';
import {ApplicationState} from 'redux/applicationState';
import {RowActions} from 'redux/constants/rowConstants';
import {dynamicStateMapper} from 'redux/dynamicStateMapper';
import {RowState} from 'redux/stateDefs/rowState';
import {$$} from 'utils/stringPaster';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  handlers: any;
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
  dynamicStateMapper<RowState, ApplicationState>(),
  mapDispatchToProps,
);

const Row = withRedux((props: OwnProps & RowState & DispatchProps) => {
  const {columns, row, user, setBidPrice, setOfferPrice, setBidQuantity, setOfferQuantity} = props;
  // Compute the total weight of the columns
  const total = columns.reduce((total, {weight}) => total + weight, 0);
  return (
    <Layout id={row.id}>
      {columns.map((column) => {
        const width = 100 * column.weight / total;
        const name = column.name;
        return (
          <Cell
            key={name}
            width={width}
            user={user}
            render={column.render}
            handlers={props.handlers}
            setOfferQuantity={setOfferQuantity}
            setOfferPrice={setOfferPrice}
            setBidQuantity={setBidQuantity}
            setBidPrice={setBidPrice}
            {...row}/>
        );
      })}
    </Layout>
  );
});

export {Row};
