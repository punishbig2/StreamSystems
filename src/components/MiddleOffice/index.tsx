import React, { ReactElement } from 'react';
import { DealBlotter } from 'components/DealBlotter';
import { DealEntryForm } from 'components/MiddleOffice/DealEntryForm';
import { SummaryLegDetails } from 'components/MiddleOffice/SummaryLegDetailsForm';

interface Props {
}

export const MiddleOffice: React.FC<Props> = (props: Props): ReactElement | null => {
  return (
    <div className={'middle-office'}>
      <div className={'left-panel'}>
        <DealBlotter/>
      </div>
      <div className={'right-panel'}>
        <DealEntryForm/>
        <SummaryLegDetails currencies={['USD', 'BRL']}/>
      </div>
    </div>
  );
};
