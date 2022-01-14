import React, { ReactElement } from "react";
import { DealEntryButtons } from "components/MiddleOffice/buttonStateResolver";

interface Props {
  isButtonDisabled(button: keyof DealEntryButtons): boolean;
  onSave(): void;
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
        onMouseUp={props.onSave}
        disabled={props.isButtonDisabled("save")}
      >
        Save
      </button>
    </>
  );
};
