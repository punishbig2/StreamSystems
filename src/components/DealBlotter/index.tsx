import React, { ReactElement } from 'react';
import { Table } from 'components/Table';
import { columns } from 'components/DealBlotter/columns';

interface Props {

}

export const DealBlotter: React.FC<Props> = (props: Props): ReactElement | null => {
  return <Table columns={columns} rows={{}} renderRow={() => null} scrollable={true}/>;
};
