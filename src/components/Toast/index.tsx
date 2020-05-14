import React, { ReactElement } from "react";

interface OwnProps {
  message: string | null;
  onDismiss: () => void;
}

export const Toast: React.FC<OwnProps> = (
  props: OwnProps
): ReactElement | null => {
  if (props.message === null) return null;
  return (
    <div className={"toast"}>
      <span>{props.message}</span>
      <div className={"button"} onClick={props.onDismiss}>
        <i className={"fa fa-times"} />
      </div>
    </div>
  );
};
