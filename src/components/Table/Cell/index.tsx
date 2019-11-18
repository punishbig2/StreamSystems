import {User} from 'interfaces/user';
import React, {CSSProperties} from 'react';

interface CellProps {
  render: React.FC<any>,
  user?: User;
  width: string;

  // Allow other properties
  [key: string]: any;
}

export const Cell: React.FC<CellProps> = (props: CellProps) => {
  const {render, width, handlers, user, ...data} = props;
  const style: CSSProperties = {width};
  return (
    <div className={'td'} style={style}>
      {render({...data, user})}
    </div>
  );
};