import { Grid } from "@material-ui/core";
import { API } from "API";
import { FormField } from "components/field";
import workareaStore from "mobx/stores/workareaStore";
import moment from "moment";
import React, { ReactElement, useEffect, useState, useCallback } from "react";
import { DealEntry, DealStatus } from "structures/dealEntry";
import { MOStrategy } from "components/MiddleOffice/interfaces/moStrategy";
import { Symbol } from "interfaces/symbol";
import { observer } from "mobx-react";
import middleOfficeStore, { StubLegInfo } from 'mobx/stores/middleOfficeStore';
import { parseTime } from "timeUtils";
import { Globals } from "golbals";
import { Sides } from "interfaces/sides";
import { ValuationModel } from "components/MiddleOffice/interfaces/valuationModel";
import { LegOptionsDef } from "components/MiddleOffice/interfaces/legOptionsDef";
import { Cut } from "components/MiddleOffice/interfaces/cut";
import fields from "components/MiddleOffice/DealEntryForm/fields";
import { FieldDef, SelectItem } from "forms/fieldDef";

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
    const { deal } = middleOfficeStore;
    const [entry, setEntry] = useState<DealEntry>(initialDealEntry);
    const [strategies, setStrategies] = useState<{
      [name: string]: MOStrategy;
    }>({});
    const [legOptionsDefs, setLegOptionsDefs] = useState<{
      [strategy: string]: LegOptionsDef[];
    }>({});
    const [styles, setStyles] = useState<string[]>([]);
    const [models, setModels] = useState<ValuationModel[]>([]);
    const [cuts, setCuts] = useState<Cut[]>([]);

    const getDerivedFieldsFromStrategy = useCallback(
      (strategy: MOStrategy | null | undefined, price: number): any => {
        if (!strategy) return {};
        const legDefinitions: LegOptionsDef[] = legOptionsDefs[strategy.name];
        if (!legDefinitions)
          throw new Error("invalid state, strategy has no legs definitions");
        return {
          legs: legDefinitions.length,
          strike: strategy.strike,
          vol: strategy.spreadvsvol === "vol" ? price : undefined,
          spread: strategy.spreadvsvol === "spread" ? price : undefined,
        };
      },
      [legOptionsDefs]
    );

    useEffect(() => {
      if (deal === null) return;
      const strategy: MOStrategy = strategies[deal.strategy];
      const id: string = deal.dealID;
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
        ...getDerivedFieldsFromStrategy(strategy, deal.lastPrice),
      };
      setEntry(newEntry);
    }, [deal, strategies, getDerivedFieldsFromStrategy]);

    const { lastPrice: price } = deal ? deal : { lastPrice: 0 };
    useEffect(() => {
      const {
        strategy,
        notional,
        buyer,
        seller,
        vol,
        strike,
        currency,
      } = entry;
      const legDefinitions: LegOptionsDef[] | undefined =
        legOptionsDefs[strategy];
      if (!legDefinitions) return;
      for (const legDefinition of legDefinitions) {
        const side: Sides =
          legDefinition.ReturnSide === "buy" ? Sides.Buy : Sides.Sell;
        const legData: StubLegInfo = {
          notional:
            notional === null ? null : notional * legDefinition.notional_ratio,
          party: side === Sides.Buy ? buyer : seller,
          side: side,
          vol: vol,
          strike: strike,
          option: legDefinition.OptionLegIn,
          currencies: [currency.slice(0, 3), currency.slice(3)],
        };
        middleOfficeStore.addStubLeg(legData);
      }
      const symbol: Symbol | undefined = workareaStore.findSymbolById(currency);
      if (symbol !== undefined) {
        const cut: Cut | undefined = cuts.find((cut: Cut) => {
          return (
            cut.Code === symbol.PrimaryCutCode &&
            cut.UTCTime === symbol.PrimaryUTCTime
          );
        });
        if (cut !== undefined) {
          middleOfficeStore.createSummaryLeg(cut, symbol);
        }
      }
    }, [cuts, entry, legOptionsDefs]);

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
      API.getValuModel().then(setModels);
      API.getOptionLegsDef().then((result: any) => {
        const legOptionsDefs = result.reduce(
          (
            groups: { [strategy: string]: LegOptionsDef[] },
            option: LegOptionsDef
          ) => {
            const key: string = option.productid;
            const group: LegOptionsDef[] = groups[key];
            if (group === undefined) {
              groups[key] = [option];
            } else {
              group.push(option);
            }
            return groups;
          },
          {}
        );
        setLegOptionsDefs(legOptionsDefs);
      });
      API.getCuts().then((cuts: any) => {
        setCuts(cuts);
      });
    }, []);

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

    const mapper = (fieldDef: FieldDef<DealEntry>): ReactElement => {
      const currencies: Symbol[] = workareaStore.symbols;
      const banks: string[] = workareaStore.banks;
      const sources: { [key: string]: any } = {
        banks,
        strategies,
        currencies,
        styles,
        models,
      };
      const { transformData, dataSource, ...field } = fieldDef;
      const source: any = !!dataSource ? sources[dataSource] : undefined;
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
        <Grid justify={"space-around"} alignItems={"stretch"} container item>
          <button type={"button"}>Price</button>
          <button type={"button"}>Submit</button>
          <button type={"button"}>Save</button>
        </Grid>
      </form>
    );
  }
);
