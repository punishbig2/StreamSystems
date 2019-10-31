import {Table, TOBHandlers} from 'components/Table';
import columns from 'columns/TOB';
import {Order} from 'interfaces/order';
import {EntryTypes} from 'interfaces/mdEntry';
import {User} from 'interfaces/user';
import React, {ReactElement, useEffect, useState} from 'react';
import {extractDOB, extractTOB} from 'utils/dataParsers';

interface Props {
  data: any[],
  onOrderWindowRequested: (type: EntryTypes, data: Order) => void;
  currentUser: User;
}

export const TOBTile = (props: Props): ReactElement => {
  const {data, currentUser} = props;
  const [tobData, setTOBData] = useState<any[]>([]);
  const [dobData, setDOBData] = useState<any[]>([]);
  const [tenor, setTenor] = useState<string | null>(null);
  const onDoubleClick = (type: EntryTypes, data: any) => props.onOrderWindowRequested(type, data);
  const onTenorSelected = (newTenor: string) => {
    if (tenor !== null) {
      setTenor(null);
    } else {
      setTenor(newTenor);
    }
  };
  const handlers: TOBHandlers = {onTenorSelected, onDoubleClick};
  useEffect((): void => {
    setTOBData(extractTOB(data, currentUser));
  }, [data, currentUser]);
  useEffect(() => {
    if (tenor === null)
      return;
    setDOBData(extractDOB(tenor, data, currentUser));
  }, [tenor, data, currentUser]);
  const rows: any[] = tenor === null ? tobData : dobData;
  return (
    <Table<TOBHandlers> columns={columns} rows={rows} handlers={handlers} user={props.currentUser}/>
  );
};
