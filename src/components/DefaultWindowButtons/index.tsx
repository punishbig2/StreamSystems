import React from "react";

interface Props {
  readonly onClose?: () => void;
  readonly onMinimize?: () => void;
  readonly onResizeToContent?: () => void;
  readonly resizeable: boolean;
}

export const DefaultWindowButtons: React.FC<Props> = (props: Props) => {
  return (
    <div className="window-buttons">
      {props.resizeable && (
        <button className="fit" onClick={props.onResizeToContent}>
          <i className="fa fa-compress" />
        </button>
      )}
      <button className="minimize" onClick={props.onMinimize}>
        <i className="fa fa-minus" />
      </button>
      <button className="restore" onClick={props.onMinimize}>
        <i className="fa fa-window-restore" />
      </button>
      <button onClick={props.onClose}>
        <i className="fa fa-times" />
      </button>
    </div>
  );
};
