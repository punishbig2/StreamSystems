import { FormField } from "components/FormField";
import { EditableFlag } from "types/product";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import {
  MiddleOfficeStore,
  MiddleOfficeStoreContext,
} from "mobx/stores/middleOfficeStore";
import React, { ReactElement } from "react";
import { DealEntry } from "types/dealEntry";

interface Props {
  readonly dealEntry: DealEntry;
  readonly summaryLeg: SummaryLeg | null;
  readonly field: FieldDef<SummaryLeg, SummaryLeg>;
  readonly disabled: boolean;
  readonly isEditMode: boolean;
  readonly onUpdateSummaryLeg: (
    fieldName: keyof SummaryLeg,
    value: any
  ) => Promise<void>;
}

export const Field: React.FC<Props> = (props: Props): ReactElement => {
  const { field, dealEntry, summaryLeg, isEditMode } = props;
  const store = React.useContext<MiddleOfficeStore>(MiddleOfficeStoreContext);
  const getValue = (): any => {
    if (summaryLeg === null) return null;
    if (
      MiddleOfficeStore.getFieldEditableFlag(
        "",
        field.name,
        dealEntry.strategy
      ) === EditableFlag.NotApplicable
    ) {
      return "N/A";
    }
    if (field.name === "dealOutput")
      throw new Error("this is not a normal value, cannot display it");
    const value = summaryLeg[field.name];
    if (
      field.type === "number" &&
      value !== null &&
      typeof value !== "number" &&
      typeof value !== "string"
    ) {
      return "";
    }

    if (value === null) {
      // FIXME: Should we do this?
      /*if (field.name === "spotDate") {
        // FIXME: this is a terrible idea
        void props.onUpdateSummaryLeg("spotDate", dealEntry.spotDate);
      }*/
    }

    return value;
  };
  const isEditable = (): boolean => {
    if (typeof field.editable === "function") {
      return field.editable(field.name, dealEntry, isEditMode, "sum");
    } else {
      return field.editable;
    }
  };
  return (
    <FormField
      key={field.name}
      disabled={props.disabled}
      name={field.name}
      label={field.label}
      value={getValue()}
      type={field.type}
      color={field.color}
      rounding={field.rounding}
      precision={field.precision}
      editable={isEditable()}
      store={store}
      onChange={props.onUpdateSummaryLeg}
    />
  );
};
