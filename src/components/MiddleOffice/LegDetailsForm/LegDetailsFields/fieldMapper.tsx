import { FormField } from "components/FormField";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import { FieldDef } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore from "mobx/stores/moStore";
import React, { ReactElement } from "react";
import { Observer } from "mobx-react";
import { DealEntry } from "structures/dealEntry";

const capitalize = (str: string): string => {
  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
};

export const fieldsMapper = (
  leg: Leg,
  onValueChange: (name: keyof Leg, value: any) => void,
  store: DealEntryStore
) => (fieldDef: FieldDef<Leg, {}, DealEntry>, index: number): ReactElement => {
  const { rates } = leg;
  const extraProps = ((): { value: any } & any => {
    if (fieldDef.type === "currency") {
      return {
        value: leg[fieldDef.name],
        currency: leg.premiumCurrency,
      };
    } else if (fieldDef.name === "rates") {
      const index: number = fieldDef.data;
      if (rates === null) {
        return { label: "??? Rage", value: "invalid" };
      } else {
        const rate = rates[index];
        return { ...rate, label: rate.currency + " Rate" };
      }
    } else if (fieldDef.name === "side") {
      return {
        value: capitalize(leg[fieldDef.name]),
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
          type={fieldDef.type}
          {...extraProps}
          onChange={onValueChange}
        />
      )}
    </Observer>
  );
};
