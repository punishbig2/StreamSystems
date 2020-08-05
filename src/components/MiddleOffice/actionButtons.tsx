import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { EntryType } from "structures/dealEntry";

interface Props {
  entryStore: DealEntryStore;
  onRemoveDeal: () => void;
}

export const ActionButtons: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { entryStore } = props;
  switch (entryStore.entryType) {
    case EntryType.Empty:
      return (
        <button
          className={"primary"}
          disabled={moStore.status !== MOStatus.Normal}
          onClick={() => entryStore.addNewDeal()}
        >
          <i className={"fa fa-plus"} />
          <span>New</span>
        </button>
      );
    case EntryType.ExistingDeal:
      if (moStore.isEditMode) {
        return (
          <button
            className={"primary"}
            disabled={moStore.status !== MOStatus.Normal}
            onClick={entryStore.cancelAddOrClone}
          >
            <i className={"fa fa-times"} />
            <span>Cancel</span>
          </button>
        );
      }
      return (
        <>
          <button
            className={"primary"}
            disabled={moStore.status !== MOStatus.Normal}
            onClick={() => entryStore.addNewDeal()}
          >
            <i className={"fa fa-plus"} />
            <span>New</span>
          </button>
          <button
            className={"primary"}
            disabled={moStore.status !== MOStatus.Normal}
            onClick={() => moStore.setEditMode(true)}
          >
            <i className={"fa fa-edit"} />
            <span>Edit</span>
          </button>
          <button
            className={"primary"}
            disabled={moStore.status !== MOStatus.Normal}
            onClick={() => entryStore.cloneDeal()}
          >
            <i className={"fa fa-clone"} />
            <span>Clone</span>
          </button>
          <button
            className={"danger"}
            disabled={moStore.status !== MOStatus.Normal}
            onClick={props.onRemoveDeal}
          >
            <i className={"fa fa-trash"} />
            <span>Remove</span>
          </button>
        </>
      );
    case EntryType.Clone:
    case EntryType.New:
      return (
        <button
          className={"primary"}
          disabled={moStore.status !== MOStatus.Normal}
          onClick={() => entryStore.cancelAddOrClone()}
        >
          <i className={"fa fa-times"} />
          <span>Cancel</span>
        </button>
      );
  }
};
