import React, { ReactElement } from "react";

interface Props {
  isModified: boolean;
  isPriced: boolean;
  onPrice?: () => void;
  onSubmitted?: () => void;
  onSave?: () => void;
}

export const ExistingEntryButtons: React.FC<Props> = (
  props: Props
): ReactElement => {
  return (
    <>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onPrice}
        disabled={props.isPriced}
      >
        Price
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSave}
        disabled={!props.isModified}
      >
        Save
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSubmitted}
        disabled={!props.isPriced}
      >
        Submit
      </button>
      <button
        type={"submit"}
        style={{ display: "none" }}
        aria-hidden={"true"}
        disabled
      />
    </>
  );
};
