import { Grid } from "@material-ui/core";
import { API } from "API";
import {
  VolSpreadRel,
  volSpreadRelationships,
} from "components/MiddleOffice/DealEntryForm/data";
import { FormField, Validity } from "components/MiddleOffice/field";
import { FieldType } from "components/MiddleOffice/helpers";
import workareaStore from "mobx/stores/workareaStore";
import moment from "moment";
import React, { ReactElement, useEffect, useState } from "react";
import { DealEntry, DealStatus } from "structures/dealEntry";
import { MOStrategy } from "structures/moStrategy";
import { Currency } from "interfaces/currency";

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
}

export const DealEntryForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const [entry, setEntry] = useState<DealEntry>({
    currency: "",
    strategy: "",
    legs: 0,
    notional: 20e6,
    legAdj: true,
    buyer: "MSCO",
    seller: "",
    tradeDate: moment(),
    dealId: "123456",
    status: DealStatus.Pending,
    style: "European",
    model: "Blacks",
  });
  const [strategies, setStrategies] = useState<any[]>([]);
  useEffect(() => {
    API.getOptionsProducts().then((result: any) => {
      setStrategies(result);
    });
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
      data: strategies.map((strategy: MOStrategy) => ({
        value: strategy.value,
        label: strategy.value
          .split(/(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/)
          .join(" "),
      })),
    },
    {
      label: "Spread",
      name: "spread",
      type: "text",
      placeholder: "0D",
      color: "orange",
      editable: true,
      validate: (value: string): Validity => {
        const regexp: RegExp = /^([0-9]+(\.[0-9]){0,1}D)/;
        console.log(regexp.test(value), value);
        if (value.length === 0) return Validity.Intermediate;
        if (regexp.test(value)) return Validity.Valid;
        return Validity.Invalid;
      },
      emptyValue: "N/A",
      data: [],
    },
    {
      label: "Vol",
      type: "percentage",
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
      type: "text",
      color: "green",
      editable: false,
    },
    {
      label: "Model",
      name: "model",
      type: "text",
      color: "green",
      editable: false,
    },
  ];

  const onChange = (name: keyof DealEntry, value: any) => {
    if (name === "strategy") {
      const newStrategy: MOStrategy | undefined = strategies.find(
        (strategy: MOStrategy) => strategy.value === value
      );
      if (newStrategy) {
        const volSpreadRel: VolSpreadRel =
          volSpreadRelationships[newStrategy.value];
        setEntry({
          ...entry,
          ...volSpreadRel,
          legs: newStrategy.legs,
          [name]: value,
        });
      } else {
        setEntry({ ...entry, [name]: value });
      }
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
};
