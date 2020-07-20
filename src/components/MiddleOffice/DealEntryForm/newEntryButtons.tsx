import React, { ReactElement } from "react";

interface Props {
  disabled: boolean;
  canSubmit: boolean;
  onSubmit: () => void;
}

export const NewEntryButtons: React.FC<Props> = (
  props: Props
): ReactElement => {
  return (
    <>
      <button
        type={"submit"}
        style={{ display: "none" }}
        aria-hidden={"true"}
        disabled
      />
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSubmit}
        disabled={!props.canSubmit || props.disabled}
      >
        Save
      </button>
    </>
  );
};
