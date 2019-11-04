import {Layout} from 'components/DefaultWindowButtons/layout';
import React from 'react';

interface Props {
  onClose: () => void;
}

export const DefaultWindowButtons: React.FC<Props> = (props: Props) => {
  return (
    <Layout>
      <button onClick={props.onClose}><i className={'fa fa-window-close'}/></button>
    </Layout>
  );
};
