import React, { ReactElement } from "react";

interface Props {
  isModified: boolean;
  isPriced: boolean;
  onPriced?: () => void;
  onSubmitted?: () => void;
  onSaved?: () => void;
}

export const ExistingEntryButtons: React.FC<Props> = (
  props: Props
): ReactElement => {
  return (
    <>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onPriced}
        disabled={props.isPriced}
      >
        Price
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSaved}
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
