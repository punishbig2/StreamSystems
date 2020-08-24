import { Leg } from "components/MiddleOffice/interfaces/leg";
import { FieldDef } from "forms/fieldDef";
import { DealEntry, DealType } from "structures/dealEntry";
import { DealStatus, toBitwise } from "types/dealStatus";

const editableFilter = (
  types: number,
  status: number = toBitwise(DealStatus.SEFConfirmed)
) => (data: any, entry?: DealEntry): boolean => {
  if (entry === undefined) return false;
  if ((toBitwise(entry.status) & status) !== 0) return false;
  return (entry.dealType & types) !== 0;
};

const fields: FieldDef<Leg, {}, DealEntry>[] = [
  {
    type: "text",
    color: "grey",
    name: "option",
    label: "Option",
    editable: false,
  },
  {
    type: "text",
    color: "grey",
    name: "side",
    label: "Side",
    editable: false,
  },
  {
    type: "text",
    color: "grey",
    name: "party",
    label: "Party",
    editable: false,
  },
  {
    type: "date",
    color: "grey",
    name: "expiryDate",
    label: "Expiry Date",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "date",
    color: "grey",
    name: "deliveryDate",
    label: "Delivery Date",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "number",
    color: "grey",
    name: "notional",
    label: "Notional",
    precision: 0,
    editable: editableFilter(DealType.Voice | DealType.Manual),
  },
  {
    type: "text",
    color: "grey",
    name: "strike",
    label: "Strike",
    editable: editableFilter(DealType.Voice | DealType.Manual),
  },
  {
    type: "percent",
    color: "grey",
    name: "vol",
    label: "Vol",
    precision: 4,
    editable: editableFilter(DealType.Voice | DealType.Manual),
  },
  {
    type: "number",
    color: "grey",
    name: "fwdPts",
    label: "Fwd Pts",
    precision: 0,
    editable: false,
  },
  {
    type: "number",
    color: "grey",
    name: "fwdRate",
    label: "Fwd Rate",
    precision: 4,
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic,
      toBitwise(DealStatus.SEFConfirmed) | toBitwise(DealStatus.Pending)
    ),
  },
  {
    type: "date",
    color: "grey",
    name: "premiumDate",
    label: "Premium Date",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "currency",
    color: "grey",
    name: "premium",
    label: "Premium",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "percent",
    color: "grey",
    name: "price",
    label: "Price % / Pips",
    precision: 4,
    editable: false,
  },
  {
    type: "currency",
    color: "grey",
    name: "hedge",
    label: "Hedge",
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "percent",
    color: "grey",
    name: "rates",
    label: "CCY1 Depo",
    data: 0,
    precision: 4,
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "percent",
    color: "grey",
    name: "rates",
    label: "CCY2 Depo",
    data: 1,
    precision: 4,
    editable: editableFilter(
      DealType.Voice | DealType.Manual | DealType.Electronic
    ),
  },
  {
    type: "number",
    color: "grey",
    name: "delta",
    label: "Delta",
    precision: 4,
    editable: false,
  },
  {
    type: "number",
    color: "grey",
    name: "usi",
    label: "USI#",
    precision: 0,
    editable: false,
  }
];

export default fields;
