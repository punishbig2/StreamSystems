import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {TOBRow} from 'interfaces/tobRow';
import {User} from 'interfaces/user';
import React from 'react';
import {RowState} from 'redux/stateDefs/rowState';

interface OwnProps {
  id: string;
  columns: ColumnSpec[];
  user?: User;
  fixedRow?: TOBRow;
}

const Row = (props: OwnProps & RowState) => {
  const {columns, row, fixedRow, user} = props;
  // Compute the total weight of the createColumns
  const total = columns.reduce((total: number, {weight}: ColumnSpec) => total + weight, 0);
  return (
    <div className={'tr'}>
      {columns.map((column) => {
        const width = 100 * column.weight / total;
        const name = column.name;
        return (
          <Cell key={name} width={width} user={user} render={column.render} {...(fixedRow || row)}/>
        );
      })}
    </div>
  );
};

export {Row};
