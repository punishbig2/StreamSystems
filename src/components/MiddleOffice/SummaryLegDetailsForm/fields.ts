import { EditableCondition } from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import moStore from "mobx/stores/moStore";
import { DealEntry } from "structures/dealEntry";

export interface IsEditableData {
  dealEntry: DealEntry;
  isEditMode: boolean;
}

const isEditable = (name: string) => (
  data: IsEditableData,
  summaryLeg?: SummaryLeg
): boolean => {
  if (!moStore.isEditMode) return false;
  const { strategy } = data.dealEntry;
  if (strategy === undefined) return false;
  const { f1 } = strategy.fields;
  const editableCondition: EditableCondition = f1[name];
  if (editableCondition === undefined) return false;
  if (editableCondition === EditableCondition.NotApplicable) return false;
  return editableCondition !== EditableCondition.NotEditable;
};

export const fields: ReadonlyArray<FieldDef<
  SummaryLeg,
  IsEditableData,
  SummaryLeg
>> = [
  {
    type: "text",
    name: "strategy",
    label: "Strategy",
    color: "grey",
    editable: isEditable("strategy"),
  },
  {
    type: "date",
    name: "tradeDate",
    label: "Trade Date",
    color: "grey",
    editable: isEditable("tradeDate"),
  },
  {
    type: "date",
    name: "spotDate",
    label: "Spot Date",
    color: "grey",
    editable: isEditable("spotDate"),
  },
  {
    type: "number",
    name: "spot",
    label: "Spot",
    color: "grey",
    editable: isEditable("spot"),
    precision: 4,
  },
  {
    type: "number",
    name: "fwdpts1",
    label: "Fwd Pts 1",
    color: "grey",
    editable: isEditable("fwdpts1"),
    precision: 4,
  },
  {
    type: "number",
    name: "fwdrate1",
    label: "Fwd Rate 1",
    color: "grey",
    editable: isEditable("fwdrate1"),
    precision: 4,
  },
  {
    type: "number",
    name: "fwdpts2",
    label: "Fwd Pts 2",
    color: "grey",
    editable: isEditable("fwdpts2"),
    precision: 4,
  },
  {
    type: "number",
    name: "fwdrate2",
    label: "Fwd Rate 2",
    color: "grey",
    editable: isEditable("fwdrate2"),
    precision: 4,
  },
  {
    type: "text",
    name: "cutCity",
    label: "Cut City",
    color: "grey",
    editable: isEditable("cutCity"),
  },
  {
    type: "text",
    name: "cutTime",
    label: "Cut Time",
    color: "grey",
    editable: isEditable("cutTime"),
  },
  {
    type: "text",
    name: "source",
    label: "Source",
    color: "grey",
    editable: isEditable("source"),
  },
  {
    type: "text",
    name: "delivery",
    label: "Delivery",
    color: "grey",
    editable: isEditable("delivery"),
  },
  {
    type: "text",
    name: "usi",
    label: "USI #",
    color: "grey",
    editable: false,
  },
];
