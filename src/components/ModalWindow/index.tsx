import {Container} from 'components/ModalWindow/container';
import {Window} from 'components/ModalWindow/window';
import React, {ReactElement} from 'react';
import ReactDOM from 'react-dom';

interface Props {
  render: (props: any) => ReactElement | null;
  visible: boolean;
}

const ModalWindow: React.FC<Props> = (props: Props): ReactElement | null => {
  const className = props.visible ? 'visible' : 'hidden';
  return ReactDOM.createPortal(
    <Container className={className}>
      <Window className={className}>
        {props.render(props)}
      </Window>
    </Container>
    , document.body);
};

export {ModalWindow};
