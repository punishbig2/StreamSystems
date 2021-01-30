import React, { PropsWithChildren, ReactElement } from "react";
import ReactDOM from "react-dom";

interface Props {
  readonly render?: (props: any) => ReactElement | null;
  readonly isOpen: boolean;
}

const ModalWindow: React.FC<PropsWithChildren<Props>> = (
  props: PropsWithChildren<Props>
): ReactElement | null => {
  const container: HTMLElement | null = document.getElementById("modals");
  if (container === null) {
    throw new Error(
      "this application will not be able to render modal windows"
    );
  }
  const Content: React.FC = (): ReactElement | null => {
    if (props.isOpen) {
      return (
        <div className={"modal-window-container"}>
          <div className={"modal-window"}>
            {props.render !== undefined ? props.render(props) : props.children}
          </div>
        </div>
      );
    } else {
      return null;
    }
  };
  return ReactDOM.createPortal(<Content />, container);
};

export { ModalWindow };
