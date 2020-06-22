import { Grid } from "@material-ui/core";
import { FormField } from "components/field";
import moment from "moment";
import React, { ReactElement, useEffect, useState } from "react";
import { DealEntry, DealStatus } from "structures/dealEntry";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { observer } from "mobx-react";
import store, { MiddleOfficeStore } from "mobx/stores/middleOfficeStore";
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import { LegOptionsDef } from "components/MiddleOffice/interfaces/legOptionsDef";
import fields from "components/MiddleOffice/DealEntryForm/fields";
import { FieldDef, SelectItem } from "forms/fieldDef";
import deepEqual from "deep-equal";
import useLegs from "components/MiddleOffice/DealEntryForm/hooks/useLegs";
import { API } from "API";
import { ValuationModel } from "components/MiddleOffice/interfaces/pricer";
import { Symbol } from "interfaces/symbol";

interface Props {}

const initialDealEntry: DealEntry = {
  currency: "",
  strategy: "",
  legs: null,
  notional: null,
  legAdj: true,
  buyer: "",
  seller: "",
  tradeDate: moment(),
  dealId: "",
  status: DealStatus.Pending,
  style: "",
  model: "",
};

export const DealEntryForm: React.FC<Props> = observer(
  (): ReactElement | null => {
    const { strategies, cuts, legOptionsDefinitions, deal } = store;
    const [referenceEntry, setReferenceEntry] = useState<DealEntry | null>(
      null
    );
    const [entry, setEntry] = useState<DealEntry>(initialDealEntry);

    const getDerivedFieldsFromStrategy = (
      strategy: MOStrategy | null | undefined,
      price: number,
      legs: number
    ): any => {
      if (!strategy) return {};
      return {
        legs: legs,
        strike: strategy.strike,
        vol: strategy.spreadvsvol === "vol" ? price : undefined,
        spread: strategy.spreadvsvol === "spread" ? price : undefined,
      };
    };

    useEffect(() => {
      if (deal === null) return;
      const strategy: MOStrategy = strategies[deal.strategy];
      const id: string = deal.dealID;
      const legsDef: LegOptionsDef[] =
        legOptionsDefinitions[strategy.name] || [];
      const newEntry: DealEntry = {
        currency: deal.symbol,
        strategy: deal.strategy,
        notional: deal.lastQuantity,
        legAdj: true,
        buyer: deal.buyer,
        seller: deal.seller,
        tradeDate: moment(parseTime(deal.transactionTime, Globals.timezone)),
        dealId: id.toString(),
        status: DealStatus.Pending,
        style: "European",
        model: 3,
        ...getDerivedFieldsFromStrategy(
          strategy,
          deal.lastPrice,
          legsDef.length
        ),
      };
      setReferenceEntry(newEntry);
      setEntry(newEntry);
    }, [deal, strategies, legOptionsDefinitions]);
    const symbol: Symbol | undefined = useLegs(
      cuts,
      entry,
      legOptionsDefinitions
    );
    const sendPricingRequest = () => {
      if (deal === null) throw new Error("no deal to get a pricing for");
      if (deal.strategy === undefined) throw new Error("invalid deal found");
      if (entry.model === "") throw new Error("node model specified");
      if (symbol === undefined)
        throw new Error("cannot get the symbol information");
      const valuationModel: ValuationModel = store.getValuationModelById(
        entry.model as number
      );
      const strategy: MOStrategy = strategies[deal.strategy];
      API.sendPricingRequest(
        deal,
        entry,
        store.legs,
        valuationModel,
        strategy,
        symbol
      );
    };
    if (deal && deal.strategy)
      console.log(strategies[deal.strategy].OptionProductType);

    const onChange = (name: keyof DealEntry, value: any) => {
      if (name === "strategy") {
        const strategy: MOStrategy = strategies[value];
        const price: number = entry.vol
          ? entry.vol
          : entry.spread
          ? entry.spread
          : 0;
        const legsDef: LegOptionsDef[] =
          legOptionsDefinitions[strategy.productid] || [];
        setEntry({
          ...entry,
          [name]: value,
          ...getDerivedFieldsFromStrategy(strategy, price, legsDef.length),
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
