import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import React, { ReactElement } from "react";
import { FieldDef } from "forms/fieldDef";
import { FormField } from "components/FormField";
import { Moment } from "moment";
import moStore from "mobx/stores/moStore";

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
      console.log(fieldDef.name, value);
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
      editable={isEditable()}
      onChange={moStore.updateSummaryLeg}
    />
  );
};
