import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import moment from 'moment';
import { FormField } from 'components/MiddleOffice/field';

interface Props {
}

interface DealEntry {
  time: moment.Moment,
  dealId: string;
  status: 'Pending' | 'Others';
  buyer: string;
  seller: string;
  legAdj: 'Equal' | 'Others';
  spot: number;
  forwardPts: number;
  forward: number;

  style: string;
  model: string;
  currency: string;
  strategy: string;
  notional: number;
  expiry: string;
  strike: string;
  vol: number;
  spread: string;
  usi: number;
}

export const DealEntryForm: React.FC<Props> = (props: Props): ReactElement | null => {
  const entry: DealEntry = {
    time: moment(),
    dealId: '12345',
    status: 'Pending',
    buyer: 'GSCO',
    seller: 'MSCO',
    legAdj: 'Equal',
    spot: 4.13,
    forwardPts: 221,
    forward: 4.1521,

    style: 'European',
    model: 'Blacks',
    currency: 'USDBRL',
    strategy: 'ATMF Straddle',
    notional: 20000000,
    expiry: '3MO',
    strike: 'ATMF',
    vol: 13,
    spread: 'N/A',
    usi: 456789,
  };

  return (
    <form>
      <Grid container>
        <Grid direction={'column'} xs={5} alignItems={'stretch'} container item>
          <fieldset>
            <FormField type={'date'} name={'tradeDate'} label={'Date'} value={entry.time} color={'green'} readOnly/>
            <FormField type={'time'} name={'tradeTime'} label={'Time'} value={entry.time} color={'green'} readOnly/>
            <FormField type={'text'} name={'dealId'} label={'Deal Id'} value={entry.dealId} color={'green'} readOnly/>
            <FormField type={'text'} name={'status'} label={'Status'} value={entry.status} color={'green'} readOnly/>
            <FormField type={'text'} name={'buyer'} label={'Buyer'} value={entry.buyer} color={'cream'} readOnly/>
            <FormField type={'text'} name={'seller'} label={'Seller'} value={entry.seller} color={'cream'} readOnly/>
            <FormField type={'text'} name={'legAdj'} label={'Leg Adj'} value={entry.legAdj} color={'green'} readOnly/>
            <FormField type={'number'} name={'spot'} label={'Spot'} value={entry.spot} precision={4} color={'orange'}
                       readOnly/>
            <FormField type={'number'} name={'forwardPts'} label={'Forward Pts'} value={entry.forwardPts}
                       color={'orange'}
                       readOnly/>
            <FormField type={'number'} name={'forward'} label={'Forward'} value={entry.spot} precision={4}
                       color={'orange'} readOnly/>
          </fieldset>
        </Grid>

        <Grid xs={5} alignItems={'stretch'} container item>
          <fieldset>
            <FormField type={'text'} name={'style'} label={'Style'} value={entry.style} color={'orange'} readOnly/>
            <FormField type={'text'} name={'model'} label={'Model'} value={entry.model} color={'orange'} readOnly/>
            <FormField type={'text'} name={'currency'} label={'CCY Pair'} value={entry.currency} color={'orange'}
                       readOnly/>
            <FormField type={'text'} name={'strategy'} label={'Strategy'} value={entry.strategy} color={'orange'}
                       readOnly/>
            <FormField type={'currency'} name={'notional'} label={'Notional'} value={entry.notional} color={'orange'}
                       readOnly/>
            <FormField type={'text'} name={'expiry'} label={'Expiry'} value={entry.expiry} color={'orange'} readOnly/>
            <FormField type={'text'} name={'strike'} label={'Strike'} value={entry.strike} color={'orange'} readOnly/>
            <FormField type={'percentage'} name={'vol'} label={'Vol'} value={entry.vol} color={'orange'} readOnly/>
            <FormField type={'text'} name={'spread'} label={'Spread'} value={entry.spread} color={'orange'}
                       readOnly/>
            <FormField type={'number'} name={'usi'} label={'USI#'} value={entry.usi} color={'orange'} readOnly/>
          </fieldset>
        </Grid>

        <Grid xs={2} alignItems={'stretch'} container item>
          <fieldset>
            <Grid xs={12} direction={'column'} alignItems={'stretch'} container item>
              <button type={'button'}>Price</button>
              <button type={'button'}>Submit</button>
            </Grid>
          </fieldset>

          <fieldset>
            <Grid xs={12} alignItems={'stretch'} container item>
              <button type={'button'}>Save</button>
            </Grid>
          </fieldset>
        </Grid>
      </Grid>
    </form>
  );
};
