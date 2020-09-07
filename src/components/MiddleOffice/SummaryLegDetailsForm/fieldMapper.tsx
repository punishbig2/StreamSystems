import { FormField } from "components/FormField";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore from "mobx/stores/moStore";
import { Moment } from "moment";
import React, { ReactElement } from "react";

export const fieldMapper = (store: DealEntryStore, entry: SummaryLeg) => (
  fieldDef: FieldDef<SummaryLeg, DealEntryStore, SummaryLeg>
): ReactElement | null => {
  const getValue = (): number | string | Moment => {
    if (fieldDef.name === "dealOutput")
      throw new Error("this is not a normal value, cannot display it");
    const value: number | string | Moment | null = entry[fieldDef.name];
    if (
      fieldDef.type === "number" &&
      value !== null &&
      typeof value !== "number" &&
      typeof value !== "string"
    ) {
      return "";
    }
    if (value === null) return "";
    return value;
  };
  const isEditable = (): boolean => {
    if (typeof fieldDef.editable === "function") {
      return fieldDef.editable(store, entry);
    } else {
      return fieldDef.editable;
    }
  };
  return (
    <FormField
      key={fieldDef.name}
      name={fieldDef.name}
      label={fieldDef.label}
      value={getValue()}
      type={fieldDef.type}
      color={fieldDef.color}
      rounding={fieldDef.rounding}
      precision={fieldDef.precision}
      editable={isEditable()}
      onChange={moStore.updateSummaryLeg}
    />
  );
};
