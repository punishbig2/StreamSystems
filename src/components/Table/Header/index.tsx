import {Column} from 'components/Table/Column';
import {ColumnSpec} from 'components/Table/columnSpecification';
import React from 'react';
import styled from 'styled-components';

interface HeaderProps<T> {
  columns: ColumnSpec[];
  handlers?: T;
  table: any;
}

const HeaderLayout = styled.div``;

export const Header: <T extends unknown>(props: HeaderProps<T>) => any = <T extends unknown>(props: HeaderProps<T>) => {
  const {columns} = props;
  const total = columns.reduce((total, {weight}) => total + weight, 0);
  return (
    <HeaderLayout>
      {columns.map(((column) =>
          <Column key={column.name} width={100 * column.weight / total}>
            {column.header(props)}
          </Column>
      ))}
    </HeaderLayout>
  );
};
