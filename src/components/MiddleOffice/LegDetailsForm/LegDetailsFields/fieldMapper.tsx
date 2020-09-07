import { FormField } from "components/FormField";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { FieldDef } from "forms/fieldDef";
import { FieldType } from "forms/fieldType";
import { getStyledValue } from "legsUtils";
import { Observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { DealEntry } from "structures/dealEntry";
import { roundPremium } from "utils/roundPremium";
import { getRoundingPrecision } from "utils/roundToNearest";

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
  const roundPremiumIdentity = (value: number | null): number | null => value;
  const extraProps = ((): { value: any } & any => {
    if (deal === null) return null;
    if (fieldDef.type === "currency") {
      if (fieldDef.name === "premium" || fieldDef.name === "hedge") {
        const { symbol } = deal;
        const preprocess =
          fieldDef.name === "premium" ? roundPremium : roundPremiumIdentity;
        return {
          value: preprocess(
            getStyledValue(leg[fieldDef.name], entry.premstyle),
            symbol
          ),
          precision: getRoundingPrecision(symbol["premium-rounding"]),
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
