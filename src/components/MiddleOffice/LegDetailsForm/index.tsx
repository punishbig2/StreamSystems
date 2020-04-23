import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import { LegDetailsFields } from 'components/MiddleOffice/LegDetailsForm/LegDetailsFields';
import { Leg } from 'components/MiddleOffice/interfaces/leg';
import moment from 'moment';

interface Props {
}

export const LegDetailsForm: React.FC<Props> = (props: Props): ReactElement | null => {
  const leg1: Leg = {
    notional: 10000000,
    premium: 260330,
    price: 2.603,
    strike: 4.1521,
    vol: 13,
    expiryDate: moment(),
    delta: 0.513001779,
    gamma: 610.925,
    vega: 20019,
    hedge: -5130017,
    dealId: '123435',
    usi: 456789,
  };
  const leg2: Leg = {
    notional: 10000000,
    premium: 206020,
    price: 2.060,
    strike: 4.1521,
    vol: 13,
    expiryDate: moment(),
    delta: -0.486854068,
    gamma: 610.925,
    vega: 20018,
    hedge: 4868540,
    dealId: '123435',
    usi: 456789,
  };
  return (
    <form>
      <Grid container>
        <Grid xs={6} container item>
          <fieldset>
            <legend>Leg 1 - Buy Call</legend>
            <LegDetailsFields {...leg1}/>
          </fieldset>
        </Grid>
        <Grid xs={6} container item>
          <fieldset>
            <legend>Leg 2 - Buy Put</legend>
            <LegDetailsFields {...leg2}/>
          </fieldset>
        </Grid>
      </Grid>
    </form>
  );
};
