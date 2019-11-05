import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {User} from 'interfaces/user';
import React from 'react';
import {connect, MapStateToProps} from 'react-redux';
import {Dispatch} from 'redux';
import {ApplicationState} from 'redux/applicationState';
import {TOBRowState} from 'redux/stateDefs/rowState';
import styled from 'styled-components';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  handlers: any;
  user?: User;
}

interface DispatchProps {
}

const RowLayout = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid ${({theme}) => theme.tableBorderColor};
  }
`;
// FIXME: this could probably be extracted to a generic function
const mapStateToProps: MapStateToProps<TOBRowState, OwnProps, ApplicationState> =
  (state: ApplicationState, ownProps: OwnProps): TOBRowState => {
    const generalizedState = state as any;
    if (generalizedState.hasOwnProperty(ownProps.id)) {
      // Forcing typescript to listen to me >(
      return generalizedState[ownProps.id] as TOBRowState;
    } else {
      return {} as TOBRowState;
    }
  };

const mapDispatchToProps = (dispatch: Dispatch, {id}: OwnProps): DispatchProps => ({});

const withRedux: (ignored: any) => any = connect<TOBRowState, DispatchProps, OwnProps, ApplicationState>(
  mapStateToProps,
  mapDispatchToProps,
);

const Row = withRedux((props: OwnProps & TOBRowState) => {
  const {columns, data, user} = props;
  // Compute the total weight of the columns
  const total = columns.reduce((total, {weight}) => total + weight, 0);
  return (
    <RowLayout>
      {columns.map((column) => {
        const width = 100 * column.weight / total;
        const name = column.name;
        return (
          <Cell key={name} width={width} render={column.render} handlers={props.handlers} user={user} {...data}/>
        );
      })}
    </RowLayout>
  );
});

export {Row};
