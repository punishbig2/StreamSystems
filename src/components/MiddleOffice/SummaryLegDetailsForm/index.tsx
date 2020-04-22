import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import { FormField } from 'components/MiddleOffice/DealEntryForm/field';
import moment from 'moment';

interface Props {
  currencies: string[],
}

export const SummaryLegDetails: React.FC<Props> = (props: Props): ReactElement | null => {
  const ccy1Depo: string = `${props.currencies[0]}Depo`;
  const ccy2Depo: string = `${props.currencies[1]}Depo`;
  const data: any = {
    strategy: 'ATMF Straddle',
    tradeDate: moment(),
    spotDate: moment(),
    premiumDate: moment(),
    strike: '',
    volSpread: 'N/A',
    expiryDate: moment(),
    deliveryDate: moment(),
    delivery: 'NFD',
    buyer: 'MSCO',
    seller: 'Equal',
    days: 92,
    cutCity: 'Sao Paulo',
    cutTime: moment(),
    source: 'PTAX',
    spot: 221,
    fwdPts: 4,
    fwdRate: 0,
    [ccy1Depo]: 0,
    [ccy2Depo]: 2.05,
  };
  return (
    <>
      <form>
        <Grid container>
          <Grid xs={7} container item>
            <Grid direction={'row'}>
              <FormField label={'Strategy'} color={'grey'} value={data.strategy} name={'strategy'} type={'text'}/>
              <FormField label={'Trade Date'} color={'grey'} value={data.tradeDate} name={'tradeDate'} type={'date'}/>
              <FormField label={'Spot Date'} color={'grey'} value={data.spotDate} name={'spotDate'} type={'date'}/>
              <FormField label={'Premium Date'} color={'grey'} value={data.premiumDate} name={'premiumDate'}
                         type={'date'}/>
              <FormField label={'Strike'} color={'grey'} value={data.strike} name={'strike'} type={'text'}/>
              <FormField label={'Vol/Spread'} color={'grey'} value={data.volSpread} name={'volSpread'} type={'text'}/>
              <FormField label={'Expiry Date'} color={'grey'} value={data.expiryDate} name={'expiryDate'}
                         type={'date'}/>
              <FormField label={'Delivery Date'} color={'grey'} value={data.deliveryDate} name={'deliveryDate'}
                         type={'date'}/>
              <FormField label={'Buyer'} color={'grey'} value={data.buyer} name={'buyer'} type={'text'}/>
              <FormField label={'Seller'} color={'grey'} value={data.seller} name={'seller'} type={'text'}/>
              <FormField label={'Days'} color={'grey'} value={data.days} name={'days'} type={'number'}/>
              <FormField label={'Cut City'} color={'grey'} value={data.cutCity} name={'cutCity'} type={'text'}/>
              <FormField label={'Cut Time'} color={'grey'} value={data.cutTime} name={'cutTime'} type={'time'}/>
              <FormField label={'Source'} color={'grey'} value={data.source} name={'source'} type={'text'}/>
              <FormField label={'Delivery'} color={'grey'} value={data.delivery} name={'delivery'} type={'text'}/>
              <FormField label={'Spot'} color={'grey'} value={data.spot} name={'spot'} type={'number'} precision={4}/>
              <FormField label={'Fwd Pts'} color={'grey'} value={data.fwdPts} name={'fwdPts'} type={'number'}/>
              <FormField label={'Fwd Rate'} color={'grey'} value={data.fwdRate} name={'fwdRate'} type={'number'}
                         precision={4}/>
              <FormField label={props.currencies[0] + ' Depo'} color={'grey'} value={data[ccy1Depo]} name={ccy1Depo}
                         type={'percentage'}/>
              <FormField label={props.currencies[1] + ' Depo'} color={'grey'} value={data[ccy2Depo]} name={ccy2Depo}
                         type={'percentage'}/>
            </Grid>
          </Grid>
          <Grid xs={5} container item>
          </Grid>
        </Grid>
      </form>
    </>
  );
};
