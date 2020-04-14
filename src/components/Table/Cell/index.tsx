import { User } from 'interfaces/user';
import React, { CSSProperties, ReactElement } from 'react';
import { PodRowStore } from 'mobx/stores/podRowStore';

interface CellProps {
  render: (props: any) => ReactElement | string | null;
  user?: User;
  width: number | string;
  colNumber?: number;
  className?: string;
  rowStore?: PodRowStore;

  // Allow other properties
  [key: string]: any;
}

export const Cell: React.FC<CellProps> = (props: CellProps) => {
  const { render, width, handlers, user, ...inheritedProps } = props;
  const style: CSSProperties = { width };
  return (
    <div className={['td', props.className].join(' ')} style={style} data-col-number={props.colNumber}>
      {render({ ...inheritedProps, user })}
    </div>
  );
};
