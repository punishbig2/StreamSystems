import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {Row} from 'components/Table/Row';
import {Order} from 'interfaces/order';
import {EntryTypes} from 'interfaces/mdEntry';
import {User} from 'interfaces/user';
import React, {ReactElement, ReactNode} from 'react';
import styled from 'styled-components';
import {Body} from 'components/Table/Body';

const Layout = styled.div`
  font-size: 13px;
  font-weight: 500;
  margin: 10px;
`;

export interface TOBHandlers {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: EntryTypes, data: Order) => void;
}

interface TableProps<T> {
  handlers: T;
  rows: any[];
  columns: ColumnSpec[];
  user: User;
  children?: ReactNode;
}

export const Table = <T extends unknown>(props: TableProps<T>): ReactElement => {
  const {rows, columns} = props;
  return (
    <Layout>
      <Header columns={columns}/>
      <Body>
        {rows.map((row) => (
          <Row key={row.id} handlers={props.handlers} user={props.user} columns={columns} data={row}/>
        ))}
      </Body>
    </Layout>
  );
};
