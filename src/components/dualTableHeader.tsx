import React from "react";

export type HeaderAction = { fn: () => void; label: string };

interface Props {
  action?: HeaderAction;
  label: string;
  disabled?: boolean;
}

export const DualTableHeader = (props: Props) => {
  const { action } = props;
  return (
    <div className={"dual-header"}>
      <div className={"first"}>{props.label}</div>
      <div className={"second"}>
        {action ? (
          <button onClick={action.fn} disabled={props.disabled}>
            {action.label}
          </button>
        ) : (
          <div>&nbsp;</div>
        )}
      </div>
    </div>
  );
};
