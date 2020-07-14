import React, { ReactElement } from "react";

interface Props {
  onSubmit: () => void;
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
        onClick={props.onSubmit}
        disabled={!props.canSubmit}
      >
        Save
      </button>
    </>
  );
};
