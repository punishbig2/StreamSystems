import React, {ReactElement} from 'react';
import ReactDOM from 'react-dom';

interface Props {
  render: (props: any) => ReactElement | null;
  visible: boolean;
}

const ModalWindow: React.FC<Props> = (props: Props): ReactElement | null => {
  const className = props.visible ? 'visible' : 'hidden';
  return ReactDOM.createPortal(
    <div className={['modal-window-container', className].join(' ')}>
      <div className={['modal-window', className].join(' ')}>
        {props.render(props)}
      </div>
    </div>
    , document.body);
};

export {ModalWindow};
