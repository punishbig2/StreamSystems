import { DealEntryButtons } from 'components/MiddleOffice/buttonStateResolver';
import { ExistingEntryButtons } from 'components/MiddleOffice/DealEntryForm/existingEntryButtons';
import { NewEntryButtons } from 'components/MiddleOffice/DealEntryForm/newEntryButtons';
import React, { ReactElement } from 'react';
import { EntryType } from 'types/dealEntry';
import { DealStatus } from 'types/dealStatus';

interface Props {
  readonly status: DealStatus;
  readonly entryType: EntryType;

  readonly submitDisabled: boolean;

  buttonsDisabled(button: keyof DealEntryButtons): boolean;
  onSubmit(): void;
  onSaveCurrentEntry(): void;
  onPrice(): void;
  onCreateOrClone(): void;
}

export const ActionButtons = (props: Props): ReactElement | null => {
  switch (props.entryType) {
    case EntryType.ExistingDeal:
      return (
        <ExistingEntryButtons
          status={props.status}
          submitDisabled={props.submitDisabled}
          isButtonDisabled={props.buttonsDisabled}
          onSubmit={props.onSubmit}
          onSave={props.onSaveCurrentEntry}
          onPrice={props.onPrice}
        />
      );
    case EntryType.New:
    case EntryType.Clone:
      return (
        <NewEntryButtons
          disabled={props.submitDisabled}
          isButtonDisabled={props.buttonsDisabled}
          onSave={props.onCreateOrClone}
        />
      );
    case EntryType.Empty:
      return null;
  }
};
