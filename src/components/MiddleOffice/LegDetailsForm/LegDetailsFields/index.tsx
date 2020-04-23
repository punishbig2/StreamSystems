import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import { Leg } from 'components/MiddleOffice/interfaces/leg';
import { FormField } from 'components/MiddleOffice/field';

type Props = Leg;

export const LegDetailsFields: React.FC<Props> = (props: Props): ReactElement | null => {
  return (
    <Grid container>
      <FormField label={'Notional'} color={'grey'} value={props.notional} name={'notional'} type={'currency'}/>
      <FormField label={'Premium'} color={'grey'} value={props.premium} name={'premium'} type={'currency'}/>
      <FormField label={'Price'} color={'grey'} value={props.price} name={'price'} type={'percentage'}/>
      <FormField label={'Strike'} color={'grey'} value={props.strike} name={'strike'} type={'number'} precision={4}/>
      <FormField label={'Vol'} color={'grey'} value={props.vol} name={'vol'} type={'percentage'}/>
      <FormField label={'Expiry Date'} color={'grey'} value={props.expiryDate} name={'expiryDate'} type={'date'}/>
      <FormField label={'Delta'} color={'grey'} value={props.delta} name={'delta'} type={'number'} precision={4}/>
      <FormField label={'Gamma'} color={'grey'} value={props.gamma} name={'premium'} type={'currency'}/>
      <FormField label={'Vega'} color={'grey'} value={props.vega} name={'vega'} type={'currency'}/>
      <FormField label={'hedge'} color={'grey'} value={props.hedge} name={'hedge'} type={'currency'}/>
      <FormField label={'Deal Id'} color={'grey'} value={props.dealId} name={'dealId'} type={'text'}/>
      <FormField label={'USI#'} color={'grey'} value={props.usi} name={'usi'} type={'number'}/>
    </Grid>
  );
};
