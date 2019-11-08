import {Layout} from 'components/Table/Cell/layout';
import {User} from 'interfaces/user';
import React from 'react';

interface CellProps {
  render: React.FC<any>,
  width: number;
  handlers: any;
  user?: User;
  // Allow other properties
  [key: string]: any;
}

export const Cell: React.FC<CellProps> = (props: CellProps) => {
  const {render, width, handlers, user, ...data} = props;
  return (
    <Layout width={width}>
      {render({...data, user, handlers})}
    </Layout>
  );
};
