import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { FieldDef } from "forms/fieldDef";
import { MoStore } from "../../../mobx/stores/moStore";
import { DealType } from "../../../structures/dealEntry";

export const fields: ReadonlyArray<FieldDef<SummaryLeg, SummaryLeg>> = [
  {
    type: "text",
    name: "strategy",
    label: "Strategy",
    color: "grey",
    editable: false /* This value is just a redundant value already editable in the deal entry form */,
  },
  {
    type: "date",
    name: "tradeDate",
    label: "Trade Date",
    color: "grey",
    editable: false /* This cannot be editable as it's set by the system */,
  },
  {
    type: "date",
    name: "spotDate",
    label: "Spot Date",
    color: "grey",
    editable: false /* This value is computed and never editable */,
  },
  {
    type: "number",
    name: "spot",
    label: "Spot",
    color: "grey",
    precision: 4,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "number",
    name: "fwdpts1",
    label: "Fwd Pts 1",
    color: "grey",
    precision: 4,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "number",
    name: "fwdrate1",
    label: "Fwd Rate 1",
    color: "grey",
    precision: 4,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "number",
    name: "fwdpts2",
    label: "Fwd Pts 2",
    color: "grey",
    precision: 4,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "number",
    name: "fwdrate2",
    label: "Fwd Rate 2",
    color: "grey",
    precision: 4,
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "text",
    name: "cutCity",
    label: "Cut City",
    color: "grey",
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "text",
    name: "cutTime",
    label: "Cut Time",
    color: "grey",
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "text",
    name: "source",
    label: "Source",
    color: "grey",
    editable: MoStore.createEditableFilter(DealType.All),
  },
  {
    type: "text",
    name: "delivery",
    label: "Delivery",
    color: "grey",
    editable: false /* Computed value cannot be edited */,
  },
  {
    type: "text",
    name: "usi",
    label: "USI #",
    color: "grey",
    editable: false /* SEF information and hence never editable */,
  },
];
