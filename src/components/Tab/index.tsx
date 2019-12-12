import React from 'react';
import {ReactElement} from 'react';

interface Props {
  onClick: (id: string) => void;
  label: string | ReactElement;
  active: boolean;
  id: string;
}

const Tab: React.FC<Props> = (props: Props): ReactElement => {
  return (
    <div className={props.active ? 'active' : undefined} onClick={() => props.onClick(props.id)}>
      {props.label}
    </div>
  );
};

export {Tab};
