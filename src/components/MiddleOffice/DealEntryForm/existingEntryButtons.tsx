import React, { ReactElement } from "react";

interface Props {
  isModified: boolean;
  isPriced: boolean;
  onPrice?: () => void;
  onSubmit?: () => void;
  onSave?: () => void;
}

export const ExistingEntryButtons: React.FC<Props> = (
  props: Props
): ReactElement => {
  return (
    <>
      <button type={"button"} className={"primary"} onClick={props.onPrice}>
        {props.isPriced ? "Re-price" : "Price"}
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
        onClick={props.onSubmit}
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
