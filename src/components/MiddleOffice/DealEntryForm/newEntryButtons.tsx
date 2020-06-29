import React, { ReactElement } from "react";

interface Props {
  onSubmitted: () => void;
  canSubmit: boolean;
}

export const NewEntryButtons: React.FC<Props> = (
  props: Props
): ReactElement => {
  return (
    <>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSubmitted}
        disabled={!props.canSubmit}
      >
        Submit
      </button>
    </>
  );
};
