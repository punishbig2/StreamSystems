import { EditableCondition } from "components/MiddleOffice/types/moStrategy";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore from "mobx/stores/moStore";

const isEditable = (name: string) => (
  data: any,
  summaryLeg?: SummaryLeg
): boolean => {
  const store: DealEntryStore = data;
  if (!moStore.isEditMode) return false;
  const { strategy } = store.entry;
  if (strategy === undefined) return false;
  const { f1 } = strategy.fields;
  const editableCondition: EditableCondition = f1[name];
  if (editableCondition === EditableCondition.NotApplicable) return false;
  return editableCondition !== EditableCondition.NotEditable;
};

export const fields: ReadonlyArray<FieldDef<
  SummaryLeg,
  DealEntryStore,
  SummaryLeg
>> = [
  {
    type: "text",
    name: "strategy",
    label: "Strategy",
    color: "grey",
    editable: false,
  },
  {
    type: "date",
    name: "tradeDate",
    label: "Trade Date",
    color: "grey",
    editable: false,
  },
  {
    type: "date",
    name: "spotDate",
    label: "Spot Date",
    color: "grey",
    editable: false,
  },
  {
    type: "number",
    name: "spot",
    label: "Spot",
    color: "grey",
    editable: false,
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
    editable: false,
  },
  {
    type: "text",
    name: "cutTime",
    label: "Cut Time",
    color: "grey",
    editable: false,
  },
  {
    type: "text",
    name: "source",
    label: "Source",
    color: "grey",
    editable: false,
  },
  {
    type: "text",
    name: "delivery",
    label: "Delivery",
    color: "grey",
    editable: false,
  },
  {
    type: "text",
    name: "usi",
    label: "USI #",
    color: "grey",
    editable: false,
  },
];
