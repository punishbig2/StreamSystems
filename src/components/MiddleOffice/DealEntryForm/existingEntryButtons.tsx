import React, { ReactElement } from "react";
import { DealStatus } from "types/dealStatus";
import { DealEntryButtons } from "components/MiddleOffice/buttonStateResolver";

interface Props {
  readonly isModified: boolean;
  readonly isEditMode: boolean;
  readonly status: DealStatus;
  readonly submitDisabled: boolean;

  isButtonDisabled(button: keyof DealEntryButtons): boolean;
  onPrice(): void;
  onSubmit(): void;
  onSave(): void;
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
        disabled={props.isButtonDisabled("price")}
      >
        {props.status === DealStatus.Priced ? "Re-price" : "Price"}
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSave}
        disabled={props.isButtonDisabled("save")}
      >
        Save
      </button>
      <button
        type={"button"}
        className={"primary"}
        onClick={props.onSubmit}
        disabled={props.isButtonDisabled("submit")}
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
