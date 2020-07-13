import React, { ReactElement } from "react";

interface Props {
  onSubmitted: () => void;
  onCancelled: () => void;
  canSubmit: boolean;
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
        onClick={props.onSubmitted}
        disabled={!props.canSubmit}
      >
        Save
      </button>
    </>
  );
};
