import { User } from 'interfaces/user';
import React, { CSSProperties, ReactElement } from 'react';

interface CellProps {
  render: (props: any) => ReactElement | string | null;
  user?: User;
  width: number;
  colNumber?: number;
  className?: string;

  // Allow other properties
  [key: string]: any;
}

export const Cell: React.FC<CellProps> = (props: CellProps) => {
  const { render, width, handlers, user, ...data } = props;
  const style: CSSProperties = { width };
  return (
    <div className={['td', props.className].join(' ')} style={style} data-col-number={props.colNumber}>
      {render({ ...data, user })}
    </div>
  );
};
