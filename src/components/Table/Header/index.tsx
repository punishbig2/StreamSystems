import {Column} from 'components/Table/Column';
import {ColumnSpec} from 'components/Table/columnSpecification';
import React from 'react';
import styled from 'styled-components';

interface HeaderProps {
  columns: ColumnSpec[];
}

const HeaderLayout = styled.div``;

export const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
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