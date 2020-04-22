import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import { FormField } from 'components/MiddleOffice/DealEntryForm/field';
import moment from 'moment';

interface Props {
  currencies: string[],
}

export const SummaryLegDetails: React.FC<Props> = (props: Props): ReactElement | null => {
  const data: any = {
    strategy: 'ATMF Straddle',
    tradeDate: moment(),
  };
  return (
    <>
      <form>
        <Grid container>
          <Grid xs={7} container item>
            <Grid direction={'row'}>
              <FormField label={'Strategy'} color={'grey'} value={data.strategy} name={'strategy'} type={'text'}/>
              <FormField label={'Trade Date'} color={'grey'} value={data.tradeDate} name={'tradeDate'} type={'text'}/>
              <FormField label={'Spot Date'} color={'grey'} value={data.spotDate} name={'spotDate'} type={'text'}/>
              <FormField label={'Premium Date'} color={'grey'} value={data.premiumDate} name={'premiumDate'}
                         type={'text'}/>
              <FormField label={'Strike'} color={'grey'} value={data.strike} name={'strike'} type={'text'}/>
              <FormField label={'Vol/Spread'} color={'grey'} value={data.volSpread} name={'volSpread'} type={'text'}/>
              <FormField label={'Expiry Date'} color={'grey'} value={data.expiryDate} name={'expiryDate'} type={'text'}/>
              <FormField label={'Delivery Date'} color={'grey'} value={data.deliveryDate} name={'deliveryDate'}
                         type={'text'}/>
              <FormField label={'Buyer'} color={'grey'} value={data.buyer} name={'buyer'} type={'text'}/>
              <FormField label={'Seller'} color={'grey'} value={data.seller} name={'seller'} type={'text'}/>
              <FormField label={'Cut City'} color={'grey'} value={data.cutCity} name={'cutCity'} type={'text'}/>
              <FormField label={'Cut Time'} color={'grey'} value={data.cutTime} name={'cutTime'} type={'text'}/>
              <FormField label={'Source'} color={'grey'} value={data.source} name={'source'} type={'text'}/>
              <FormField label={'Delivery'} color={'grey'} value={data.delivery} name={'delivery'} type={'text'}/>
              <FormField label={'Spot'} color={'grey'} value={data.spot} name={'spot'} type={'text'}/>
              <FormField label={'Fwd Pts'} color={'grey'} value={data.fwdPts} name={'fwdPts'} type={'text'}/>
              <FormField label={'Fwd Rate'} color={'grey'} value={data.fwdRate} name={'fwdRate'} type={'text'}/>
              <FormField label={props.currencies[0] + ' Depo'} color={'grey'} value={data.ccy1Depo} name={'ccy1Depo'}
                         type={'text'}/>
              <FormField label={props.currencies[1] + ' Depo'} color={'grey'} value={data.ccy2Depo} name={'ccy2Depo'}
                         type={'text'}/>
            </Grid>
          </Grid>
          <Grid xs={5} container item>
          </Grid>
        </Grid>
      </form>
    </>
  );
};
