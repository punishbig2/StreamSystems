import {Body} from 'components/Table/Body';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {Layout} from 'components/Table/layout';
import {Row} from 'components/Table/Row';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {User} from 'interfaces/user';
import React, {ReactElement} from 'react';

export interface TOBHandlers {
  onTenorSelected: (tenor: string) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOfrsButtonClicked: () => void;
  onPriceChanged: (entry: TOBEntry) => void;
  onSizeChanged: (entry: TOBEntry) => void;
}

interface TableProps<T> {
  handlers?: T;
  rows?: { [id: string]: any };
  columns: ColumnSpec[];
  user?: User;
}

export const Table: <T extends unknown>(props: TableProps<T>) => (React.ReactElement | null) =
  <T extends unknown>(props: TableProps<T>): ReactElement | null => {
    const {rows, columns} = props;
    if (!rows)
      return null;
    const keys: string[] = Object.keys(rows);
    return (
      <Layout>
        <Header<T> columns={columns} handlers={props.handlers}/>
        <Body>
          {keys.map((key) => (
            <Row key={key} handlers={props.handlers} user={props.user} columns={columns} data={rows[key]}/>
          ))}
        </Body>
      </Layout>
    );
  };
