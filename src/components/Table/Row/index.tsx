import {Cell} from 'components/Table/Cell';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {User} from 'models/user';
import React from 'react';
import styled from 'styled-components';

interface RowProps {
  columns: ColumnSpec[];
  data: any;
  handlers: any;
  user: User;
}

const RowLayout = styled.div``;

export const Row: React.FC<RowProps> = (props: RowProps) => {
  const {columns, data, user} = props;
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
};
