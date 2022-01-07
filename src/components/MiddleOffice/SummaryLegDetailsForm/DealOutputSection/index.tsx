import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { FieldType } from "forms/fieldType";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import { getStyledValue } from "utils/legsUtils";
import React, { useEffect, useState } from "react";
import { DealEntry } from "types/dealEntry";
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
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const { dealOutput, premiumStyle, dealEntry } = props;
  const { symbol } = dealEntry;
  const [priceType, setPriceType] = useState<FieldType>(
    symbol.premiumCCYpercent ? "percent" : "number"
  );
  const [premiumPrecision, setPremiumPrecision] = useState<number>(0);
  const [premium, setPremium] = useState<number | null>(null);
  const [currencies, setCurrencies] = useState<{ [key: string]: string }>({
    premium: symbol.premiumCCY,
    risk: symbol.riskCCY,
  });
  useEffect((): void => {
    if (dealOutput === null) return;
    // Update precision if it changes (it depends on this value)
    // FIXME: it seems we need to ignore this
    setPremiumPrecision(0); // (getRoundingPrecision(symbol["premium-rounding"]));
    setPremium(
      roundPremium(getStyledValue(dealOutput.premium, premiumStyle), symbol)
    );
  }, [symbol, dealOutput, premiumStyle]);
  useEffect((): void => {
    if (symbol === undefined) return;
    if (symbol.premiumCCYpercent) {
      setPriceType("percent");
    } else {
      setPriceType("number");
    }
    setCurrencies({
      premium: symbol.premiumCCY,
      risk: symbol.riskCCY,
    });
  }, [symbol]);
  if (dealOutput === null) return null;
  return (
    <Grid alignItems={"stretch"} container>
      <fieldset className={"group"} disabled={props.disabled}>
        <legend>Deal Output</legend>
        <FormField<any>
          label={"Net Premium"}
          color={"grey"}
          value={premium}
          name={"netPremium"}
          type={"currency"}
          currency={currencies.premium}
          precision={premiumPrecision}
          disabled={props.disabled}
          store={store}
        />
        <FormField<any>
          label={"Price %/Pips"}
          color={"grey"}
          value={getStyledValue(dealOutput.price, dealEntry.premstyle)}
          name={"pricePercent"}
          type={priceType}
          precision={4}
          disabled={props.disabled}
          store={store}
        />
        <FormField<any>
          label={"Delta"}
          color={"grey"}
          value={getStyledValue(dealOutput.delta, dealEntry.deltastyle)}
          name={"delta"}
          type={"number"}
          precision={4}
          disabled={props.disabled}
          store={store}
        />
        <FormField<any>
          label={"Gamma"}
          color={"grey"}
          value={dealOutput.gamma}
          name={"gamma"}
          type={"currency"}
          currency={currencies.risk}
          disabled={props.disabled}
          store={store}
        />
        <FormField<any>
          label={"Net Vega"}
          color={"grey"}
          value={dealOutput.vega}
          name={"vega"}
          type={"currency"}
          currency={currencies.risk}
          disabled={props.disabled}
          store={store}
        />
        <FormField<any>
          label={"Net Hedge"}
          color={"grey"}
          value={getStyledValue(dealOutput.hedge, dealEntry.deltastyle)}
          name={"hedge"}
          type={"currency"}
          currency={currencies.risk}
          disabled={props.disabled}
          store={store}
        />
      </fieldset>
    </Grid>
  );
};
