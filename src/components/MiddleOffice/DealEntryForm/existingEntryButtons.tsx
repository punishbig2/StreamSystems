import React, { ReactElement } from "react";
import { DealStatus } from "types/dealStatus";

interface Props {
  readonly isModified: boolean;
  readonly isEditMode: boolean;
  readonly status: DealStatus;
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
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onPrice}
        disabled={
          props.disabled ||
          props.status === DealStatus.SEFConfirmed ||
          props.isEditMode
        }
      >
        {props.status === DealStatus.Priced ? "Re-price" : "Price"}
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSave}
        disabled={!props.isModified || props.disabled}
      >
        Save
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSubmit}
        disabled={
          props.status === DealStatus.Pending ||
          props.disabled ||
          props.isEditMode
        }
      >
        Submit
      </button>
      {/* Trick to prevent accidental submission */}
      <button
        type={"submit"}
        style={{ display: "none" }}
        aria-hidden={"true"}
        disabled
      />
    </>
  );
};
