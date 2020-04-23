import React, { ReactElement } from 'react';
import { DealBlotter } from 'components/DealBlotter';
import { DealEntryForm } from 'components/MiddleOffice/DealEntryForm';
import { SummaryLegDetailsForm } from 'components/MiddleOffice/SummaryLegDetailsForm';
import { LegDetailsForm } from 'components/MiddleOffice/LegDetailsForm';
import { CollapsibleFormGroup } from 'components/MiddleOffice/CollapsibleFormGroup';

interface Props {
}

export const MiddleOffice: React.FC<Props> = (props: Props): ReactElement | null => {
  return (
    <div className={'middle-office'}>
      <div className={'left-panel'}>
        <DealBlotter/>
      </div>
      <div className={'right-panel'}>
        <div className={'form-group'}>
          <h1>Deal Entry</h1>
          <DealEntryForm/>
        </div>
        <CollapsibleFormGroup title={'Summary Leg Details'}>
          <SummaryLegDetailsForm currencies={['USD', 'BRL']}/>
          <CollapsibleFormGroup title={'Leg Details'}>
            <LegDetailsForm/>
          </CollapsibleFormGroup>
        </CollapsibleFormGroup>
      </div>
    </div>
  );
};
