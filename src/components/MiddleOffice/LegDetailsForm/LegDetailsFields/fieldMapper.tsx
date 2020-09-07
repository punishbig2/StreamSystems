import { FormField } from "components/FormField";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { FieldDef } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { Validity } from "forms/validity";
import { getStyledValue } from "legsUtils";
import { Observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { toNumber } from "utils/isNumeric";
import { getRoundingPrecision, roundToNearest } from "utils/roundToNearest";

const capitalize = (str: string): string => {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
};

export const fieldsMapper = (
  leg: Leg,
  onValueChange: (name: keyof Leg, value: any) => void,
  store: DealEntryStore
) => (fieldDef: FieldDef<Leg, {}, DealEntry>, index: number): ReactElement => {
  const { rates } = leg;
  const { entry } = store;
  const { deal } = moStore;
  const extraProps = ((): { value: any } & any => {
    if (deal === null) return null;
    if (fieldDef.type === "strike") {
      const { symbol } = deal;
      const numeric: number | null | undefined = toNumber(
        leg[fieldDef.name] as string
      );
      if (numeric === undefined || numeric === null) {
        return {
          value: null,
        };
      }
      const rounding: number | undefined = symbol["strike-rounding"];
      if (rounding === undefined) {
        return {
          value: null,
        };
      }
      const [value, validity] = roundToNearest(numeric, rounding);
      if (validity !== Validity.Valid) {
        return {
          value: null,
        };
      } else {
        return {
          value: value,
          precision: getRoundingPrecision(rounding),
          rounding: rounding,
        };
      }
    } else if (fieldDef.type === "currency") {
      if (fieldDef.name === "premium" || fieldDef.name === "hedge") {
        return {
          value: getStyledValue(leg[fieldDef.name], entry.premstyle),
          currency: leg.premiumCurrency,
        };
      } else {
        return {
          value: leg[fieldDef.name],
          currency: leg.premiumCurrency,
        };
      }
    } else if (fieldDef.name === "rates") {
      const index: number = fieldDef.data;
      if (rates === null || rates === undefined) {
        throw new Error("cannot proceed with invalid rates");
      } else {
        const rate = rates[index];
        return { ...rate, label: rate.currency + " Rate" };
      }
    } else if (fieldDef.name === "side") {
      return {
        value: capitalize(leg[fieldDef.name]),
      };
    } else if (fieldDef.name === "price") {
      return {
        value: getStyledValue(leg[fieldDef.name], entry.premstyle),
      };
    } else if (fieldDef.name === "delta") {
      return {
        value: getStyledValue(leg[fieldDef.name], entry.deltastyle),
      };
    } else {
      return {
        value: leg[fieldDef.name],
      };
    }
  })();
  const isEditable = (fieldDef: FieldDef<Leg, {}, DealEntry>): boolean => {
    if (!moStore.isEditMode) return false;
    if (typeof fieldDef.editable !== "function") {
      return fieldDef.editable;
    } else {
      return fieldDef.editable(null, store.entry);
    }
  };

  const getType = (): FieldType => {
    if (fieldDef.name === "price" && deal !== null) {
      const { symbol } = deal;
      if (symbol.premiumCCYpercent) {
        return "percent";
      } else {
        return "number";
      }
    }
    return fieldDef.type;
  };
  return (
    <Observer key={fieldDef.name + index}>
      {() => (
        <FormField<Leg>
          id={leg.option}
          color={fieldDef.color}
          label={fieldDef.label}
          editable={isEditable(fieldDef)}
          precision={fieldDef.precision}
          name={fieldDef.name}
          rounding={fieldDef.rounding}
          type={getType()}
          {...extraProps}
          onChange={onValueChange}
          disabled={moStore.status !== MOStatus.Normal}
        />
      )}
    </Observer>
  );
};
