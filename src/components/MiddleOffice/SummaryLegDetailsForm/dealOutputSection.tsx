import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { FieldType } from "forms/fieldType";
import { getStyledValue } from "legsUtils";
import moStore from "mobx/stores/moStore";
import React, { useEffect, useMemo, useState } from "react";
import { DealEntry } from "structures/dealEntry";
import { DealOutput } from "types/dealOutput";
import { Symbol } from "types/symbol";
import { roundPremium } from "utils/roundPremium";
import { getRoundingPrecision } from "utils/roundToNearest";

interface Props {
  premiumStyle: string | undefined;
  entry: DealEntry;
  disabled: boolean;
  dealOutput: DealOutput | null;
}

export const DealOutputSection: React.FC<Props> = (
  props: Props
): React.ReactElement | null => {
  const { dealOutput, premiumStyle, entry } = props;
  const { deal } = moStore;
  const [priceType, setPriceType] = useState<FieldType>("number");
  const [premiumPrecision, setPremiumPrecision] = useState<number>(0);
  const [premium, setPremium] = useState<number | null>(null);
  const symbol: Symbol | undefined = useMemo(
    (): Symbol | undefined => (deal !== null ? deal.symbol : undefined),
    [deal]
  );
  const [premiumCurrency, setPremiumCurrency] = useState<string>("USD");
  useEffect(() => {
    if (dealOutput === null || dealOutput.premiumCurrency === undefined) {
      if (symbol !== undefined) {
        setPremiumCurrency(symbol.premiumCCY);
      }
    } else {
      setPremiumCurrency(dealOutput.premiumCurrency);
    }
  }, [symbol, dealOutput]);
  useEffect(() => {
    if (deal === null || dealOutput === null) return;
    const { symbol } = deal;
    // Update precision if it changes (it depends on this value)
    setPremiumPrecision(getRoundingPrecision(symbol["premium-rounding"]));
    setPremium(
      roundPremium(getStyledValue(dealOutput.premium, premiumStyle), symbol)
    );
  }, [deal, dealOutput, premiumStyle]);
  useEffect(() => {
    if (symbol === undefined) return;
    if (symbol.premiumCCYpercent) {
      setPriceType("percent");
    } else {
      setPriceType("number");
    }
  }, [symbol]);
  if (dealOutput === null) return null;
  const price = ((value: number | null): number | null => {
    if (value === null) return null;
    return 100 * value;
  })(getStyledValue(dealOutput.price, entry.premstyle));

  console.log(priceType, dealOutput.price);
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
          value={price}
          name={"pricePercent"}
          type={priceType}
          precision={4}
          disabled={props.disabled}
        />
        <FormField
          label={"Delta"}
          color={"grey"}
          value={getStyledValue(dealOutput.delta, entry.deltastyle)}
          name={"delta"}
          type={"number"}
          precision={20}
          disabled={props.disabled}
        />
        <FormField
          label={"Gamma"}
          color={"grey"}
          value={dealOutput.gamma}
          name={"gamma"}
          type={"currency"}
          currency={premiumCurrency}
          disabled={props.disabled}
        />
        <FormField
          label={"Net Vega"}
          color={"grey"}
          value={dealOutput.vega}
          name={"vega"}
          type={"currency"}
          currency={premiumCurrency}
          disabled={props.disabled}
        />
        <FormField
          label={"Net Hedge"}
          color={"grey"}
          value={getStyledValue(dealOutput.hedge, entry.deltastyle)}
          name={"hedge"}
          type={"currency"}
          currency={premiumCurrency}
          disabled={props.disabled}
        />
      </fieldset>
    </Grid>
  );
};
