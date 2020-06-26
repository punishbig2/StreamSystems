import { Grid } from "@material-ui/core";
import { FormField } from "components/field";
import moment from "moment";
import React, { ReactElement, useEffect, useState } from "react";
import { DealEntry, DealStatus } from "structures/dealEntry";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { observer } from "mobx-react";
import store from "mobx/stores/middleOfficeStore";
import MO, { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import fields from "components/MiddleOffice/DealEntryForm/fields";
import { FieldDef, SelectItem } from "forms/fieldDef";
import deepEqual from "deep-equal";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { API } from "API";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";

interface Props {}

const initialDealEntry: DealEntry = {
  currencyPair: "",
  strategy: "",
  legs: null,
  notional: null,
  legAdj: true,
  buyer: "",
  seller: "",
  tradeDate: moment(),
  expiryDate: moment(),
  deliveryDate: moment(),
  dealId: "",
  status: DealStatus.Pending,
  style: "",
  model: "",
  tenor: "",
};

export const DealEntryForm: React.FC<Props> = observer(
  (): ReactElement | null => {
    const { strategies, cuts, deal } = store;
    const [referenceEntry, setReferenceEntry] = useState<DealEntry | null>(
      null
    );
    const [entry, setEntry] = useState<DealEntry>(initialDealEntry);

    useEffect(() => {
      if (deal === null) return;
      const strategy: MOStrategy = strategies[deal.strategy];
      const id: string = deal.dealID;
      const legsCount: number = MO.getOutLegsCount(deal.strategy);
      const newEntry: DealEntry = {
        currencyPair: deal.currencyPair,
        strategy: deal.strategy,
        notional: 1E6 * deal.lastQuantity,
        legAdj: true,
        buyer: deal.buyer,
        seller: deal.seller,
        tradeDate: deal.tradeDate,
        expiryDate: deal.expiryDate,
        deliveryDate: deal.deliveryDate,
        dealId: id.toString(),
        status: DealStatus.Pending,
        style: "European",
        tenor: deal.tenor,
        model: 3,
        legs: legsCount,
        strike: strategy.strike,
        vol: strategy.spreadvsvol === "vol" ? deal.lastPrice : undefined,
        spread: strategy.spreadvsvol === "spread" ? deal.lastPrice : undefined,
      };
      setReferenceEntry(newEntry);
      setEntry(newEntry);
    }, [deal, strategies]);
    useLegs(cuts, deal);
    const sendPricingRequest = () => {
      if (deal === null) throw new Error("no deal to get a pricing for");
      if (deal.strategy === undefined) throw new Error("invalid deal found");
      if (entry.model === "") throw new Error("node model specified");
      const valuationModel: ValuationModel = store.getValuationModelById(
        entry.model as number
      );
      const strategy: MOStrategy = strategies[deal.strategy];
      MO.setSendingPricingRequest(true);
      API.sendPricingRequest(
        deal,
        entry,
        store.legs,
        valuationModel,
        strategy
      ).then(() => {
        MO.setSendingPricingRequest(false);
      });
    };
    const onChange = (name: keyof DealEntry, value: any) => {
      if (name === "strategy") {
        const strategy: MOStrategy = strategies[value];
        /*const price: number = entry.vol
          ? entry.vol
          : entry.spread
          ? entry.spread
          : 0;*/
        const legsCount: number = MO.getOutLegsCount(value);
        const price: number | null = !!deal ? deal.lastPrice : null;
        setEntry({
          ...entry,
          [name]: value,
          legs: legsCount,
          strike: strategy.strike,
          spread: strategy.spreadvsvol === "spread" ? price : undefined,
          vol: strategy.spreadvsvol === "vol" ? price : undefined
        });
      } else {
        setEntry({ ...entry, [name]: value });
      }
    };

    const mapper = (
      fieldDef: FieldDef<DealEntry, MiddleOfficeStore>
    ): ReactElement => {
      const { transformData, dataSource, ...field } = fieldDef;
      const source: any = !!dataSource ? store[dataSource] : undefined;
      const data: SelectItem[] = !!transformData ? transformData(source) : [];
      const value: any = entry[field.name];
      return (
        <FormField
          key={field.name + field.type}
          {...field}
          data={data}
          onChange={onChange}
          value={value}
        />
      );
    };

    return (
      <form>
        <Grid alignItems={"stretch"} container>
          <Grid xs={12} item>
            <fieldset className={"full-height"}>{fields.map(mapper)}</fieldset>
          </Grid>
        </Grid>
        <div className={"button-box"}>
          <button
            type={"button"}
            className={"primary"}
            onClick={sendPricingRequest}
            disabled={deal === null}
          >
            Price
          </button>
          <button type={"button"} className={"primary"}>
            Submit
          </button>
          <button
            type={"button"}
            className={"secondary"}
            disabled={deepEqual(entry, referenceEntry)}
          >
            Save
          </button>
        </div>
      </form>
    );
  }
);
