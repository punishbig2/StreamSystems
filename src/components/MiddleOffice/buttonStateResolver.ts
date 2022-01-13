import { DealEntry, DealType, EntryType } from "types/dealEntry";
import { DealStatus } from "types/dealStatus";

export interface DealEntryButtons {
  readonly new: boolean;
  readonly cancel: boolean;
  readonly clone: boolean;
  readonly remove: boolean;
  readonly edit: boolean;
  readonly price: boolean;
  readonly save: boolean;
  readonly submit: boolean;
}

const isNewDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  if (dealType === DealType.Electronic) {
    return isEditMode;
  }

  return false;
};

const isCancelDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  return !isEditMode;
};

const isCloneDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  if (status === DealStatus.SEFFailed) {
    return true;
  }

  return isEditMode;
};

const isRemoveDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  return status !== DealStatus.Pending && status !== DealStatus.Priced;
};

const isEditDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  if (dealType === DealType.Electronic) {
    return isEditMode;
  }

  return false;
};

const isPriceDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  return status !== DealStatus.Pending && status !== DealStatus.Priced;
};

const isSaveDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  return !isEditMode && !isModified;
};

const isSubmitDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  return status !== DealStatus.Priced && status !== DealStatus.SEFComplete && status !== DealStatus.SEFFailed;
};

export const isButtonDisabled = (
  button: keyof DealEntryButtons,
  entry: DealEntry,
  isEditMode: boolean,
  isModified: boolean
): boolean => {
  if (entry.status === DealStatus.NoStatus) {
    return true;
  }

  switch (button) {
    case "new":
      return isNewDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "cancel":
      return isCancelDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "clone":
      return isCloneDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "remove":
      return isRemoveDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "edit":
      return isEditDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "price":
      return isPriceDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "save":
      return isSaveDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
    case "submit":
      return isSubmitDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified
      );
  }

  return true;
};
