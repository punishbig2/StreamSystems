import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {Row} from 'components/Table/Row';
import {User} from 'models/user';
import React from 'react';
import styled from 'styled-components';
import {Body} from 'components/Table/Body';

const Layout = styled.div`
  font-size: 13px;
  font-weight: 500;
  margin: 10px;
`;

interface TableProps {
  handlers: any;
  rows: any[],
  columns: ColumnSpec[],
  user: User;
}

export const Table: React.FC<TableProps> = (props: TableProps) => {
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
