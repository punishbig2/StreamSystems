import React, { ReactElement } from "react";
import { Grid } from "@material-ui/core";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { FormField } from "components/formField";
import { Sides } from "interfaces/sides";

type Props = Leg;

export const LegDetailsFields: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { rates } = props;
  return (
    <Grid container>
      <FormField
        label={"Option"}
        color={"grey"}
        value={props.option}
        name={"option"}
        type={"text"}
      />
      <FormField
        label={"Side"}
        color={"grey"}
        value={props.side === Sides.Buy ? "Buy" : "Sell"}
        name={"side"}
        type={"text"}
      />
      <FormField
        label={"Party"}
        color={"grey"}
        value={props.party}
        name={"party"}
        type={"text"}
      />
      <FormField
        label={"Notional"}
        color={"orange"}
        value={props.notional}
        name={"notional"}
        type={"number"}
      />
      <FormField
        label={"Premium Date"}
        color={"grey"}
        value={props.premiumDate}
        name={"premiumDate"}
        type={"date"}
      />
      <FormField
        label={"Premium"}
        color={"grey"}
        value={props.premium}
        name={"premium"}
        type={"currency"}
        currency={props.premiumCurrency}
      />
        <FormField
        label={"Price"}
        color={"grey"}
        value={props.pricePercent}
        name={"price"}
        type={"number"}
        precision={2}
      />
      <FormField
        label={"Strike"}
        color={"grey"}
        value={props.strike}
        name={"strike"}
        type={"number"}
        precision={4}
      />
      <FormField
        label={"Vol"}
        color={"grey"}
        value={props.vol}
        name={"vol"}
        type={"percent"}
      />
      <FormField
        label={"Expiry Date"}
        color={"grey"}
        value={props.expiryDate}
        name={"expiryDate"}
        type={"date"}
      />
      <FormField
        label={"Delivery Date"}
        color={"grey"}
        value={props.deliveryDate}
        name={"deliveryDate"}
        type={"date"}
      />
      <FormField
        label={"Days"}
        color={"grey"}
        value={props.days}
        name={"days"}
        type={"number"}
        precision={0}
      />
      <FormField
        label={"Fwd Pts"}
        color={"grey"}
        value={props.fwdPts}
        name={"fwdPts"}
        type={"number"}
        precision={0}
      />
      <FormField
        label={"Fwd Rate"}
        color={"grey"}
        value={props.fwdRate}
        name={"fwdRate"}
        type={"number"}
        precision={4}
      />
      <FormField
        label={"Delta"}
        color={"grey"}
        value={props.delta}
        name={"delta"}
        type={"number"}
        precision={4}
      />
      <FormField
        label={"Gamma"}
        color={"grey"}
        value={props.gamma}
        name={"premium"}
        type={"currency"}
        currency={props.premiumCurrency}
      />
      <FormField
        label={"Vega"}
        color={"grey"}
        value={props.vega}
        name={"vega"}
        type={"currency"}
        currency={props.premiumCurrency}
      />
      <FormField
        label={"Hedge"}
        color={"grey"}
        value={props.hedge}
        name={"hedge"}
        type={"currency"}
        currency={props.premiumCurrency}
      />
      <FormField
        label={rates[0].currency + " Rate"}
        color={"grey"}
        value={rates[0].value}
        name={"ccy1Rate"}
        type={"percent"}
        precision={4}
      />
      <FormField
        label={rates[1].currency + " Rate"}
        color={"grey"}
        value={rates[1].value}
        name={"ccy2Rate"}
        type={"percent"}
        precision={4}
      />
    </Grid>
  );
};
