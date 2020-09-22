import React from "react";
import ReactDOM from "react-dom";

export enum ToastType {
  Success = "success",
  Error = "error",
  Warning = "warning",
}

interface Props {
  readonly message: string;
  readonly type: ToastType;
  readonly onRemove: () => void;
}

const Toast: React.FC<Props> = (props: Props): React.ReactElement => {
  return (
    <div className={"toast " + props.type}>
      <div className={"message"}>{props.message}</div>
      <div className={"close-button"} onClick={props.onRemove} />
    </div>
  );
};

export const toast = {
  show: (message: string, type: ToastType, timeout = 10000): void => {
    const { body } = document;
    const element = document.createElement("div");
    // Add the element to the body
    body.appendChild(element);
    const removeMe = () => {
      body.removeChild(element);
    };
    // Render it
    ReactDOM.render(
      <Toast onRemove={removeMe} type={type} message={message} />,
      element
    );
    // Remove it afterwards
    if (timeout > 0) {
      setTimeout(removeMe, timeout);
    }
  },
};
