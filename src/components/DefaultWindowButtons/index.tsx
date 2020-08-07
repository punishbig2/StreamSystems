import React from "react";

interface Props {
  readonly isMinimized: boolean;
  readonly isAdjusted: boolean;
  readonly onClose?: () => void;
  readonly onMinimize?: () => void;
  readonly onAdjustSize?: () => void;
}

export const DefaultWindowButtons: React.FC<Props> = (props: Props) => {
  return (
    <div className={"window-buttons"}>
      {props.isAdjusted ? null : (
        <button onClick={props.onAdjustSize}>
          <i className={"fa fa-compress"} />
        </button>
      )}
      <button onClick={props.onMinimize}>
        {props.isMinimized ? (
          <i className={"fa fa-window-restore"} />
        ) : (
          <i className={"fa fa-minus"} />
        )}
      </button>
      <button onClick={props.onClose}>
        <i className={"fa fa-times"} />
      </button>
    </div>
  );
};
