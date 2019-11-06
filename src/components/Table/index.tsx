import {Body} from 'components/Table/Body';
import {ColumnSpec} from 'components/Table/columnSpecification';
import {Header} from 'components/Table/Header';
import {Layout} from 'components/Table/layout';
import {Row} from 'components/Table/Row';
import {EntryTypes} from 'interfaces/mdEntry';
import {TOBEntry} from 'interfaces/tobEntry';
import {TOBTable} from 'interfaces/tobTable';
import {User} from 'interfaces/user';
import React, {ReactElement} from 'react';

export interface TOBHandlers {
  onTenorSelected: (tenor: string, table: TOBTable) => void;
  onDoubleClick: (type: EntryTypes, data: any) => void;
  onRunButtonClicked: (rows: TOBTable) => void;
  onRefBidsButtonClicked: () => void;
  onRefOffersButtonClicked: () => void;
  onBidCanceled: (entry: TOBEntry) => void;
  onOfferCanceled: (entry: TOBEntry) => void;
  onCreateOrder: (entry: TOBEntry, value: number) => void;
  onCancelOrder: (entry: TOBEntry) => void;
}

interface Props<T> {
  handlers?: T;
  rows?: { [id: string]: any };
  columns: ColumnSpec[];
  user?: User;
  prefix?: string;
}

export const Table: <T>(props: Props<T>) => (React.ReactElement | null) =
  <T extends unknown>(props: Props<T>): ReactElement | null => {
    const {rows, columns, handlers} = props;
    if (!rows)
      return null;
    const keys: string[] = Object.keys(rows);
    const mapRow = (key: string) => {
      const {user} = props;
      const id: string = props.prefix ? `${props.prefix}${key}` : key;
      const row: any = rows[key];
      // Build the row object
      return <Row {...{id, key, handlers, user, columns, row}}/>;
    };
    return (
      <Layout>
        <Header<T> columns={columns} handlers={props.handlers} table={rows}/>
        <Body>
          {keys.map(mapRow)}
        </Body>
      </Layout>
    );
  };
