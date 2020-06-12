import { Grid } from "@material-ui/core";
import { API } from "API";
import { FormField, Validity } from "components/MiddleOffice/field";
import { FieldType } from "components/MiddleOffice/helpers";
import workareaStore from "mobx/stores/workareaStore";
import moment from "moment";
import React, { ReactElement, useEffect, useState, useCallback } from "react";
import { DealEntry, DealStatus } from "structures/dealEntry";
import { MOStrategy } from "interfaces/moStrategy";
import { Currency } from "interfaces/currency";
import { observer } from "mobx-react";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import { Sides } from "interfaces/sides";
import { ValuationModel } from 'interfaces/valuationModel';

interface Props {}

interface FieldDef {
  type: FieldType;
  color: "green" | "orange" | "cream" | "grey";
  name: keyof DealEntry;
  label: string;
  editable: boolean;
  placeholder?: string;
  data?: { value: any; label: string }[];
  mask?: string;
  emptyValue?: string;
  validate?: (value: string) => Validity;
  precision?: number;
}

const initialDealEntry: DealEntry = {
  currency: "",
  strategy: "",
  legs: 0,
  notional: 10e6,
  legAdj: true,
  buyer: "",
  seller: "",
  tradeDate: moment(),
  dealId: "",
  status: DealStatus.Pending,
  style: "European",
  model: 3,
};

export const DealEntryForm: React.FC<Props> = observer(
  (): ReactElement | null => {
    const { deal } = middleOfficeStore;
    const [entry, setEntry] = useState<DealEntry>(initialDealEntry);
    const [strategies, setStrategies] = useState<{
      [name: string]: MOStrategy;
    }>({});
    const [styles, setStyles] = useState<string[]>([]);
    const [models, setModels] = useState<ValuationModel[]>([]);

    const getDerivedFieldsFromStrategy = useCallback(
      (strategy: MOStrategy | null | undefined, price: number): any => {
        if (!strategy) return {};
        console.log(strategy);
        return {
          legs: strategy.pricerlegs,
          strike: strategy.strike,
          vol: strategy.spreadvsvol === "vol" ? price : undefined,
          spread: strategy.spreadvsvol === "spread" ? price : undefined,
        };
      },
      []
    );

    useEffect(() => {
      if (deal === null) return;
      const strategy: MOStrategy = strategies[deal.strategy];
      const id: string = deal.dealID;
      const newEntry: DealEntry = {
        currency: deal.symbol,
        strategy: deal.strategy,
        notional: 10e6,
        legAdj: true,
        buyer: deal.buyer,
        seller: deal.seller,
        tradeDate: moment(parseTime(deal.transactionTime, Globals.timezone)),
        dealId: id.toString(),
        status: DealStatus.Pending,
        style: "European",
        model: "Blacks",
        ...getDerivedFieldsFromStrategy(strategy, deal.lastPrice),
      };
      setEntry(newEntry);
    }, [deal, strategies, getDerivedFieldsFromStrategy]);

    const { strategy, notional, buyer } = entry;
    const { lastPrice: price } = deal ? deal : { lastPrice: 0 };
    useEffect(() => {
      const moStrategy: MOStrategy | undefined = strategies[strategy];
      if (!moStrategy) return;
      middleOfficeStore.createStubLegs(
        price,
        notional,
        buyer,
        Sides.Buy,
        moStrategy
      );
      // eslint-disable-next-line
    }, [strategy, notional, buyer, price, strategies]);

    useEffect(() => {
      API.getProductsEx().then((result: any) => {
        setStrategies(
          result.reduce(
            (
              strategies: { [name: string]: MOStrategy },
              strategy: MOStrategy
            ): { [name: string]: MOStrategy } => {
              return { ...strategies, [strategy.name]: strategy };
            },
            {}
          )
        );
      });
      API.getOptexStyle().then(setStyles);
      API.getValuModel().then(setModels)
    }, []);
    const banks: string[] = workareaStore.banks;
    const currencies: Currency[] = workareaStore.currencies;
    const fields: FieldDef[] = [
      {
        label: "CCYPair",
        type: "dropdown",
        name: "currency",
        color: "orange",
        editable: true,
        data: currencies.map((currency: Currency) => ({
          value: currency.name,
          label: currency.name,
        })),
      },
      {
        label: "Strategy",
        type: "dropdown",
        name: "strategy",
        color: "orange",
        editable: true,
        data: Object.values(strategies).map((strategy: MOStrategy) => ({
          value: strategy.name,
          label: strategy.description,
        })),
      },
      {
        label: "Strike",
        name: "strike",
        type: "text",
        placeholder: "0D",
        color: "orange",
        editable: true,
        emptyValue: "N/A",
        data: [],
      },
      {
        label: "Spread",
        name: "spread",
        type: "number",
        placeholder: "0",
        color: "orange",
        editable: true,
        emptyValue: "N/A",
        precision: 2,
        data: [],
      },
      {
        label: "Vol",
        type: "percent",
        placeholder: "0%",
        name: "vol",
        color: "orange",
        editable: false,
        emptyValue: "N/A",
      },
      {
        label: "Notional",
        type: "currency",
        name: "notional",
        color: "orange",
        editable: true,
      },
      {
        label: "Leg Adj",
        type: "dropdown",
        name: "legAdj",
        color: "orange",
        editable: true,
        data: [
          {
            value: true,
            label: "TRUE",
          },
          {
            value: false,
            label: "FALSE",
          },
        ],
      },
      {
        label: "Buyer",
        type: "dropdown",
        name: "buyer",
        color: "cream",
        editable: true,
        data: banks.map((name: string) => ({
          value: name,
          label: name,
        })),
      },
      {
        label: "Seller",
        type: "dropdown",
        name: "seller",
        color: "cream",
        editable: true,
        data: banks.map((name: string) => ({
          value: name,
          label: name,
        })),
      },
      {
        label: "Legs",
        type: "number",
        name: "legs",
        color: "green",
        editable: false,
      },
      {
        label: "Trade Date",
        type: "date",
        name: "tradeDate",
        color: "green",
        editable: false,
      },
      {
        label: "Timestamp",
        type: "time",
        name: "tradeDate",
        color: "green",
        editable: false,
      },
      {
        label: "Deal Id",
        name: "dealId",
        type: "text",
        color: "green",
        editable: false,
      },
      {
        label: "Status",
        name: "status",
        type: "text",
        color: "green",
        editable: false,
      },
      {
        label: "Style",
        name: "style",
        type: "dropdown",
        color: "green",
        editable: false,
        data: styles.map((name: string) => ({
          value: name,
          label: name,
        })),
      },
      {
        label: "Model",
        name: "model",
        type: "dropdown",
        color: "green",
        editable: false,
        data: models.map((model: ValuationModel) => ({
          value: model.ValuationModelID,
          label: model.OptionModelDesc,
        })),
      },
    ];

    const onChange = (name: keyof DealEntry, value: any) => {
      if (name === "strategy") {
        setEntry({
          ...entry,
          [name]: value,
          ...getDerivedFieldsFromStrategy(
            strategies[value],
            entry.vol ? entry.vol : entry.spread ? entry.spread : 0
          ),
        });
      } else {
        setEntry({ ...entry, [name]: value });
      }
    };

    return (
      <form>
        <Grid alignItems={"stretch"} container>
          <Grid xs={12} item>
            <fieldset className={"full-height"}>
              {fields.map((field: FieldDef) => (
                <FormField
                  key={field.name + field.type}
                  {...field}
                  onChange={onChange}
                  value={entry[field.name]}
                />
              ))}
            </fieldset>
          </Grid>
        </Grid>
        <Grid justify={"space-around"} alignItems={"stretch"} container item>
          <button type={"button"}>Price</button>
          <button type={"button"}>Submit</button>
          <button type={"button"}>Save</button>
        </Grid>
      </form>
    );
  }
);
