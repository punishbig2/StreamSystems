import React, { ReactElement } from 'react';
import { Grid } from '@material-ui/core';
import { FormField } from 'components/MiddleOffice/field';
import moment from 'moment';

interface Props {
  currencies: string[];
}

interface SummaryLegDetails {
  strategy: string;
  tradeDate: moment.Moment;
  spotDate: moment.Moment;
  spot: number;
  spread: string;
  cutCity: string;
  cutTime: moment.Moment;
  source: string;
  delivery: string;
  usi: number;
  brokerage: {
    buyerComm: number;
    sellerComm: number;
  };
  dealOutput: {
    netPremium: number;
    pricePercent: number;
    delta: number;
    gamma: number;
    vega: number;
    hedge: number;
  };
}

export const SummaryLegDetailsForm: React.FC<Props> = (
  props: Props,
): ReactElement | null => {
  const data: SummaryLegDetails = {
    strategy: 'ATMF Straddle',
    tradeDate: moment(),
    spotDate: moment(),
    spot: 221,
    spread: 'N/A',
    cutCity: 'Sao Paulo',
    cutTime: moment(),
    source: '',
    delivery: '',
    usi: 456789,
    brokerage: {
      buyerComm: 300,
      sellerComm: 300,
    },
    dealOutput: {
      netPremium: 466.35,
      pricePercent: 0.0233175,
      delta: 0.026147711,
      gamma: 1221850,
      vega: 40036,
      hedge: -2614777,
    },
  };
  const { brokerage, dealOutput } = data;
  return (
    <>
      <form>
        <Grid container>
          <Grid alignItems={'stretch'} container item>
            <fieldset>
              <FormField
                label={'Strategy'}
                color={'grey'}
                value={data.strategy}
                name={'strategy'}
                type={'text'}
              />
              <FormField
                label={'Trade Date'}
                color={'grey'}
                value={data.tradeDate}
                name={'tradeDate'}
                type={'date'}
              />
              <FormField
                label={'Spot Date'}
                color={'grey'}
                value={data.spotDate}
                name={'spotDate'}
                type={'date'}
              />
              <FormField
                label={'Spot'}
                color={'grey'}
                value={data.spot}
                name={'spot'}
                type={'number'}
                precision={4}
              />

              <FormField
                label={'Cut City'}
                color={'grey'}
                value={data.cutCity}
                name={'cutCity'}
                type={'text'}
              />
              <FormField
                label={'Cut Time'}
                color={'grey'}
                value={data.cutTime}
                name={'cutTime'}
                type={'time'}
              />
              <FormField
                label={'Source'}
                color={'grey'}
                value={data.source}
                name={'source'}
                type={'text'}
              />
              <FormField
                label={'Delivery'}
                color={'grey'}
                value={data.delivery}
                name={'delivery'}
                type={'text'}
              />
            </fieldset>
          </Grid>
          <Grid alignItems={'stretch'} container>
            <fieldset>
              <legend>Brokerage</legend>
              <FormField
                label={'Buyer Comm'}
                color={'grey'}
                value={brokerage.buyerComm}
                name={'buyerComm'}
                type={'currency'}
              />
              <FormField
                label={'Seller Comm'}
                color={'grey'}
                value={brokerage.sellerComm}
                name={'sellerComm'}
                type={'currency'}
              />
              <FormField
                label={'Total Comm'}
                color={'grey'}
                value={brokerage.buyerComm + brokerage.sellerComm}
                name={'totalComm'}
                type={'currency'}
              />
            </fieldset>
          </Grid>
          <Grid alignItems={'stretch'} container>
            <fieldset>
              <legend>Deal Output</legend>
              <FormField
                label={'Price %'}
                color={'grey'}
                value={dealOutput.pricePercent}
                name={'pricePercent'}
                type={'number'}
                precision={8}
              />
              <FormField
                label={'Delta'}
                color={'grey'}
                value={dealOutput.delta}
                name={'delta'}
                type={'number'}
                precision={8}
              />
              <FormField
                label={'Gamma'}
                color={'grey'}
                value={dealOutput.gamma}
                name={'gamma'}
                type={'currency'}
              />
              <FormField
                label={'Vega'}
                color={'grey'}
                value={dealOutput.vega}
                name={'vega'}
                type={'currency'}
              />
              <FormField
                label={'Hedge'}
                color={'grey'}
                value={dealOutput.hedge}
                name={'hedge'}
                type={'currency'}
              />
            </fieldset>
          </Grid>
        </Grid>
      </form>
    </>
  );
};
