import {Body} from 'components/Table/Body';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {Layout} from 'components/Table/layout';
import {Row} from 'components/Table/Row';
import {EntryTypes} from 'interfaces/mdEntry';
import {SortInfo} from 'interfaces/sortInfo';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement, useState} from 'react';

export enum SortDirection {
  Descending, Ascending, None
}

export interface TOBHandlers {
  onTenorSelected: (tenor: string, table: TOBTable) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: () => void;
  onRefBidsButtonClicked: () => void;
  onRefOffersButtonClicked: () => void;
  onCreateOrder: (entry: TOBEntry, value: number, type: EntryTypes) => void;
  onCancelOrder: (entry: TOBEntry) => void;
}

interface Props<T> {
  handlers?: T;
  rows?: { [id: string]: any };
  columns: ColumnSpec[];
  user?: User;
}

export const Table: <T>(props: Props<T>) => (React.ReactElement | null) =
  <T extends unknown>(props: Props<T>): ReactElement | null => {
    const [sortBy, setSortBy] = useState<SortInfo | undefined>();
    const {rows, columns, handlers} = props;
    if (!rows)
      return null;
    const keys: string[] = Object.keys(rows);
    const mapRow = (key: string) => {
      const {user} = props;
      const id: string = key;
      const row: any = rows[key];
      // Build the row object
      return <Row {...{id, key, handlers, user, columns, row}}/>;
    };
    return (
      <Layout>
        <Header<T> columns={columns} handlers={props.handlers} table={rows} setSortBy={setSortBy} sortBy={sortBy}/>
        <Body>
          {keys.map(mapRow)}
        </Body>
      </Layout>
    );
  };
