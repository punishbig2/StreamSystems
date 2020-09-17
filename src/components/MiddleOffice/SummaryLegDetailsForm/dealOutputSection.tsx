import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { FieldType } from "forms/fieldType";
import { getStyledValue } from "legsUtils";
import React, { useEffect, useState } from "react";
import { DealEntry } from "structures/dealEntry";
import { DealOutput } from "types/dealOutput";
import { roundPremium } from "utils/roundPremium";

interface Props {
  premiumStyle: string | undefined;
  dealEntry: DealEntry;
  disabled: boolean;
  dealOutput: DealOutput | null;
}

export const DealOutputSection: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  const { dealOutput, premiumStyle, dealEntry } = props;
  const [priceType, setPriceType] = useState<FieldType>("number");
  const [premiumPrecision, setPremiumPrecision] = useState<number>(0);
  const [premium, setPremium] = useState<number | null>(null);
  const { symbol } = dealEntry;
  const [[premiumCurrency, riskCurrency], setCurrencies] = useState<
    [string, string]
  >(["USD", "USD"]);
  useEffect(() => {
    if (dealOutput === null) return;
    // Update precision if it changes (it depends on this value)
    // FIXME: it seems we need to ignore this
    setPremiumPrecision(0); // (getRoundingPrecision(symbol["premium-rounding"]));
    setPremium(
      roundPremium(getStyledValue(dealOutput.premium, premiumStyle), symbol)
    );
  }, [symbol, dealOutput, premiumStyle]);
  useEffect(() => {
    if (symbol === undefined) return;
    setCurrencies([symbol.premiumCCY, symbol.riskCCY]);
    if (symbol.premiumCCYpercent) {
      setPriceType("percent");
    } else {
      setPriceType("number");
    }
  }, [symbol]);
  if (dealOutput === null) return null;
  return (
    <Grid alignItems={"stretch"} container>
      <fieldset className={"group"} disabled={props.disabled}>
        <legend>Deal Output</legend>
        <FormField
          label={"Net Premium"}
          color={"grey"}
          value={premium}
          name={"netPremium"}
          type={"currency"}
          currency={premiumCurrency}
          precision={premiumPrecision}
          disabled={props.disabled}
        />
        <FormField
          label={"Price %/Pips"}
          color={"grey"}
          value={getStyledValue(dealOutput.price, dealEntry.premstyle)}
          name={"pricePercent"}
          type={priceType}
          precision={4}
          disabled={props.disabled}
        />
        <FormField
          label={"Delta"}
          color={"grey"}
          value={getStyledValue(dealOutput.delta, dealEntry.deltastyle)}
          name={"delta"}
          type={"number"}
          precision={4}
          disabled={props.disabled}
        />
        <FormField
          label={"Gamma"}
          color={"grey"}
          value={dealOutput.gamma}
          name={"gamma"}
          type={"currency"}
          currency={riskCurrency}
          disabled={props.disabled}
        />
        <FormField
          label={"Net Vega"}
          color={"grey"}
          value={dealOutput.vega}
          name={"vega"}
          type={"currency"}
          currency={riskCurrency}
          disabled={props.disabled}
        />
        <FormField
          label={"Net Hedge"}
          color={"grey"}
          value={getStyledValue(dealOutput.hedge, dealEntry.deltastyle)}
          name={"hedge"}
          type={"currency"}
          currency={riskCurrency}
          disabled={props.disabled}
        />
      </fieldset>
    </Grid>
  );
};
