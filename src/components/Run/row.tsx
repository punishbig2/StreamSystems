import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBRow, TOBRowStatus} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import React from 'react';
import {RowState} from 'redux/stateDefs/rowState';
import {percentage} from 'utils';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  user?: User;
  fixedRow?: TOBRow;
  weight: number;
}

const Row = (props: OwnProps & RowState) => {
  const {columns, row, fixedRow, user} = props;
  return (
    <div className={'tr' + (row.status === TOBRowStatus.BidGreaterThanOfrError ? ' error' : '')}>
      {columns.map((column) => {
        const width: string = percentage(column.weight, props.weight);
        const name: string = column.name;
        return (
          <Cell key={name} width={width} user={user} render={column.render} {...(fixedRow || row)}/>
        );
      })}
    </div>
  );
};

export {Row};
