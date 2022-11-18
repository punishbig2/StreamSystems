import React, { PropsWithChildren, ReactElement } from 'react';
import ReactDOM from 'react-dom';

interface Props {
  readonly render?: (props: any) => ReactElement | null;
  readonly isOpen: boolean;
}

const ModalWindow: React.FC<PropsWithChildren<Props>> = (
  props: PropsWithChildren<Props>
): ReactElement | null => {
  const container: HTMLElement | null = document.getElementById('modals');
  if (container === null) {
    throw new Error('this application will not be able to render modal windows');
  }
  const { render, children, isOpen, ...inheritedProps } = props;

  const content = React.useMemo((): ReactElement | null => {
    if (isOpen) {
      return (
        <div className="modal-window-container">
          <div className="modal-window">
            {render !== undefined ? render(inheritedProps) : children}
          </div>
        </div>
      );
    } else {
      return null;
    }
  }, [isOpen, render, inheritedProps, children]);

  return ReactDOM.createPortal(content, container);
};

export { ModalWindow };
