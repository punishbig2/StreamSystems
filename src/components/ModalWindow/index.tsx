import React, {ReactElement} from 'react';
import ReactDOM from 'react-dom';

interface Props {
  render: (props: any) => ReactElement | null;
  visible: boolean;
}

const ModalWindow: React.FC<Props> = (props: Props): ReactElement | null => {
  const className = props.visible ? 'visible' : 'hidden';
  const container: HTMLElement | null = document.getElementById('modals');
  if (container === null)
    return null;
  return ReactDOM.createPortal(
    <div className={['modal-window-container', className].join(' ')}>
      <div className={['modal-window', className].join(' ')}>
        {props.render(props)}
      </div>
    </div>,
    container,
  );
};

export {ModalWindow};
