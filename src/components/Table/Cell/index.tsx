import {User} from 'interfaces/user';
import React from 'react';
import {theme} from 'theme';

interface CellProps {
  render: React.FC<any>,
  width: number;
  user?: User;

  // Allow other properties
  [key: string]: any;
}

export const Cell: React.FC<CellProps> = (props: CellProps) => {
  const {render, width, handlers, user, ...data} = props;
  const rowHeight: string = `${theme.tableRowSize}px`;
  const style = {width: `${width}%`, lineHeight: rowHeight, height: rowHeight};
  return (
    <div style={style} className={'td'}>
      {render({...data, user})}
    </div>
  );
};
