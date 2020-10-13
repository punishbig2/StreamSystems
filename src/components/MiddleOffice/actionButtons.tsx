import React, { ReactElement } from "react";
import { EntryType } from "structures/dealEntry";

interface Props {
  readonly entryType: EntryType;
  readonly disabled: boolean;
  readonly isEditMode: boolean;
  readonly editable: boolean;
  readonly onRemoveDeal: () => void;
  readonly onCancelAddOrClone: () => void;
  readonly onAddNewDeal: () => void;
  readonly onEdit: () => void;
  readonly onCloneDeal: () => void;
}

export const ActionButtons: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const cancelButton: ReactElement = (
    <button
      className={"primary"}
      disabled={props.disabled}
      onClick={props.onCancelAddOrClone}
    >
      <i className={"fa fa-times"} />
      <span>Cancel</span>
    </button>
  );
  switch (props.entryType) {
    case EntryType.Empty:
      return (
        <button
          className={"primary"}
          disabled={props.disabled}
          onClick={props.onAddNewDeal}
        >
          <i className={"fa fa-plus"} />
          <span>New</span>
        </button>
      );
    case EntryType.ExistingDeal:
      if (props.isEditMode) {
        return cancelButton;
      }
      return (
        <>
          <button
            className={"primary"}
            disabled={props.disabled}
            onClick={props.onAddNewDeal}
          >
            <i className={"fa fa-plus"} />
            <span>New</span>
          </button>
          <button
            className={"primary"}
            disabled={props.disabled || !props.editable}
            onClick={props.onEdit}
          >
            <i className={"fa fa-edit"} />
            <span>Edit</span>
          </button>
          <button
            className={"primary"}
            disabled={props.disabled}
            onClick={props.onCloneDeal}
          >
            <i className={"fa fa-clone"} />
            <span>Clone</span>
          </button>
          <button
            className={"danger"}
            disabled={props.disabled || !props.editable}
            onClick={props.onRemoveDeal}
          >
            <i className={"fa fa-trash"} />
            <span>Remove</span>
          </button>
        </>
      );
    case EntryType.Clone:
    case EntryType.New:
      return cancelButton;
  }
};
