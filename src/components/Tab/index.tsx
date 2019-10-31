import {Layout} from 'components/Tab/layout';
import * as React from 'react';
import {ReactElement} from 'react';

interface Props {
  onClick: (id: string) => void;
  label: string | ReactElement;
  active: boolean;
  id: string;
}

const Tab: React.FC<Props> = (props: Props): ReactElement => {
  return (
    <Layout className={props.active ? 'active' : undefined} onClick={() => props.onClick(props.id)}>
      {props.label}
    </Layout>
  );
};

export {Tab};
