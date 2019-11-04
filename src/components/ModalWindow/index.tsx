import {Container} from 'components/ModalWindow/container';
import {Window} from 'components/ModalWindow/window';
import React, {ReactElement} from 'react';

interface Props {
  render: (props: any) => ReactElement;
  visible: boolean;
}

const ModalWindow: React.FC<Props> = (props: Props): ReactElement | null => {
  const className = props.visible ? 'visible' : 'hidden';
  return (
    <Container className={className}>
      <Window className={className}>
        {props.render(props)}
      </Window>
    </Container>
  );
};

export {ModalWindow};
