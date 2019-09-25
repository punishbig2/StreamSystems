import {ColumnSpec} from 'components/Table/columnSpecification';
import React, {Component, ReactNode} from 'react';
import styled from 'styled-components';

const Layout = styled.div`
  padding: 10px;
  font-size: 14px;
`;

const Header = styled.div``;
const ColumnHeader = styled.div``;


interface TableProps {
  rows: any[],
  columns: ColumnSpec[],
}

class Table extends Component<TableProps> {
  public render = (): ReactNode => {
    return (
      <Layout>
        <Header>
          <ColumnHeader/>
        </Header>
        Example
      </Layout>
    );
  }
}

export default Table;
