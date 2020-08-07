import React, { ReactElement } from "react";

interface Props {
  readonly isModified: boolean;
  readonly isPriced: boolean;
  readonly disabled: boolean;
  readonly onPrice?: () => void;
  readonly onSubmit?: () => void;
  readonly onSave?: () => void;
}

export const ExistingEntryButtons: React.FC<Props> = (
  props: Props
): ReactElement => {
  return (
    <>
      <button type={"button"} className={"primary"} onClick={props.onPrice} disabled={props.disabled}>
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
        disabled={!props.isPriced || props.disabled}
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
