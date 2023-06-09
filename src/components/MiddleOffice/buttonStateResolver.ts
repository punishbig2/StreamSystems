import { DealEntry, DealType, EntryType } from 'types/dealEntry';
import { DealStatus } from 'types/dealStatus';

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
  _isModified: boolean
): boolean => {
  if (entryType === EntryType.Empty) {
    return false;
  }

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
  _isModified: boolean
): boolean => {
  if (entryType === EntryType.Clone || entryType === EntryType.New) {
    return false;
  }

  return !isEditMode;
};

const isCloneDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  _isModified: boolean
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
  _isEditMode: boolean,
  _isModified: boolean
): boolean => {
  return status !== DealStatus.Pending && status !== DealStatus.Priced;
};

const isEditDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  _isModified: boolean
): boolean => {
  if (status === DealStatus.SEFComplete || status === DealStatus.STPComplete) {
    return true;
  }

  return isEditMode;
};

const isPriceDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  _isModified: boolean
): boolean => {
  if (isEditMode) {
    return true;
  }

  return status !== DealStatus.Pending && status !== DealStatus.Priced;
};

const isSaveDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  isEditMode: boolean,
  isModified: boolean,
  isReadyForSubmission: boolean
): boolean => {
  if (entryType === EntryType.New || entryType === EntryType.Clone) {
    return !isReadyForSubmission;
  }

  return !isEditMode || !isModified;
};

const isSubmitDisabled = (
  dealType: DealType,
  entryType: EntryType,
  status: DealStatus,
  _isEditMode: boolean,
  _isModified: boolean
): boolean => {
  return (
    status !== DealStatus.Priced &&
    status !== DealStatus.SEFComplete &&
    status !== DealStatus.SEFFailed
  );
};

export const isButtonDisabled = (
  button: keyof DealEntryButtons,
  entry: DealEntry,
  isEditMode: boolean,
  isModified: boolean,
  isReadyForSubmission: boolean
): boolean => {
  if (
    entry.status === DealStatus.NoStatus &&
    (entry.type === EntryType.ExistingDeal || entry.type === EntryType.Empty)
  ) {
    return entry.type !== EntryType.Empty;
  }

  switch (button) {
    case 'new':
      return isNewDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
    case 'cancel':
      return isCancelDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
    case 'clone':
      return isCloneDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
    case 'remove':
      return isRemoveDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
    case 'edit':
      return isEditDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
    case 'price':
      return isPriceDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
    case 'save':
      return isSaveDisabled(
        entry.dealType,
        entry.type,
        entry.status,
        isEditMode,
        isModified,
        isReadyForSubmission
      );
    case 'submit':
      return isSubmitDisabled(entry.dealType, entry.type, entry.status, isEditMode, isModified);
  }

  return true;
};
