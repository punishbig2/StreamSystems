import { DealEntryButtons } from 'components/MiddleOffice/buttonStateResolver';
import React, { ReactElement } from 'react';
import { DealStatus } from 'types/dealStatus';

interface Props {
  readonly status: DealStatus;
  readonly submitDisabled: boolean;

  isButtonDisabled(button: keyof DealEntryButtons): boolean;
  onPrice(): void;
  onSubmit(): void;
  onSave(): void;
}

export const ExistingEntryButtons: React.FC<Props> = (props: Props): ReactElement => {
  return (
    <>
      <button
        type="button"
        className="primary"
        onMouseUp={props.onPrice}
        disabled={props.isButtonDisabled('price')}
      >
        {props.status === DealStatus.Priced ? 'Re-price' : 'Price'}
      </button>
      <button
        type="button"
        className="primary"
        onMouseUp={props.onSave}
        disabled={props.isButtonDisabled('save')}
      >
        Save
      </button>
      <button
        type="button"
        className="primary"
        onMouseUp={props.onSubmit}
        disabled={props.isButtonDisabled('submit') || props.submitDisabled}
      >
        Submit
      </button>
    </>
  );
};
