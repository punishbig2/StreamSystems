import { SizeHeader } from "components/SizeHeader";
import { RunSize } from "components/RunSize";
import { RunColumnData, SizeHeaderProps } from "components/Run/columnData";
import { Price } from "components/Table/CellRenderers/Price";
import { Tenor } from "components/Table/CellRenderers/Tenor";
import { ColumnSpec } from "components/Table/columnSpecification";
import { Order, OrderStatus } from "types/order";
import { PodRow, PodRowStatus } from "types/podRow";
import { ArrowDirection } from "types/w";
import strings from "locales";
import React from "react";
import { RunActions } from "components/Run/reducer";
import { DualTableHeader } from "components/dualTableHeader";
import { getNthParentOf } from "utils/skipTab";
import { $$ } from "utils/stringPaster";
import { TabDirection } from "components/NumericInput";

type RowType = PodRow & { defaultBidSize: number; defaultOfrSize: number };

const ignoreTabbedOut = () => {
  // THIS SHOULD BE EXPLICITLY IGNORE
};

const RunPriceColumn = (
  data: RunColumnData,
  type: "bid" | "ofr"
): ColumnSpec => {
  const onChange = type === "bid" ? data.onBidChanged : data.onOfrChanged;
  const label: string = type === "bid" ? strings.Bid : strings.Ofr;
  const actionType: RunActions =
    type === "bid" ? RunActions.Bid : RunActions.Ofr;

  const onPriceChange = (row: RowType) => (
    input: HTMLInputElement,
    price: number | null,
    changed: boolean,
    tabDirection: TabDirection
  ) => {
    if (price !== null) {
      if (onChange(row.id, price, changed)) {
        data.focusNext(input, tabDirection, actionType);
      }
    } else {
      data.focusNext(input, tabDirection, actionType);
    }
  };

  return {
    name: `${type}-price`,
    header: () => <DualTableHeader label={label} />,
    render: (row: RowType) => {
      const order: Order = row[type];
      return (
        <Price
          uid={$$("run", order.uid(), order.type)}
          arrow={ArrowDirection.None}
          status={order.status}
          value={order.price}
          animated={false}
          allowZero={true}
          onSubmit={onPriceChange(row)}
          onTabbedOut={ignoreTabbedOut}
          onNavigate={data.onNavigate}
        />
      );
    },
    template: "999999.99",
    width: 4,
  };
};

const RunSizeColumn = (
  data: RunColumnData,
  type: "bid" | "ofr"
): ColumnSpec => {
  const defaultSize: SizeHeaderProps =
    type === "bid" ? data.defaultBidSize : data.defaultOfrSize;
  const onChange = type === "bid" ? data.onBidQtyChanged : data.onOfrQtyChanged;
  const focusNextInput = (input: HTMLInputElement) => {
    const parent: Element | null = getNthParentOf(input, 9);
    if (parent === null)
      throw new Error("seriously? how can an input like this have no parent?");
    const targetInput: HTMLInputElement | null = ((): HTMLInputElement | null => {
      switch (type) {
        case "bid":
          return parent.querySelector(
            '.tr[data-row-number="0"] .td[data-col-number="2"] input'
          );
        case "ofr":
          return parent.querySelector(
            '.tr[data-row-number="0"] .td[data-col-number="3"] input'
          );
        default:
          return null;
      }
    })();
    if (targetInput !== null) {
      targetInput.focus();
    }
  };

  const onSubmit = (input: HTMLInputElement, value: number) => {
    defaultSize.onSubmit(input, value);
    // Move to the next cell
    focusNextInput(input);
  };

  return {
    name: `${type}-size`,
    header: () => (
      <SizeHeader
        value={defaultSize.value}
        minimum={defaultSize.minimum}
        type={defaultSize.type}
        onReset={defaultSize.onReset}
        onSubmit={onSubmit}
      />
    ),
    render: (row: RowType) => {
      const order: Order = row[type];
      return (
        <RunSize
          id={row.id}
          value={order.size}
          order={order}
          defaultValue={defaultSize.value}
          minimumSize={data.minimumSize}
          visible={data.visible}
          onTabbedOut={data.focusNext}
          onChange={onChange}
          onNavigate={data.onNavigate}
          onDeactivateOrder={data.onDeactivateOrder}
          onActivateOrder={data.onActivateOrder}
        />
      );
    },
    template: "9999999",
    width: 3,
  };
};

const TenorColumn: ColumnSpec = {
  name: "tenor",
  header: () => <DualTableHeader label={""} />,
  render: (row: RowType) => {
    const { tenor } = row;
    if (row.status !== PodRowStatus.Normal) {
      return (
        <div className={"error-cell"}>
          <i className={"fa fa-exclamation-triangle"} />
        </div>
      );
    }
    return <Tenor tenor={tenor} onTenorSelected={() => null} />;
  },
  template: "WW",
  width: 2,
};

const MidCol = (data: RunColumnData) => ({
  name: "mid",
  header: () => <DualTableHeader label={strings.Mid} />,
  render: ({ id, mid }: RowType) => (
    <Price
      uid={`run-${id}-mid`}
      value={mid}
      className={"mid"}
      arrow={ArrowDirection.None}
      status={OrderStatus.None}
      onSubmit={(
        input: HTMLInputElement,
        value: number | null,
        changed: boolean
      ) => {
        if (value !== null) {
          data.onMidChanged(id, value, changed);
        }
      }}
      onTabbedOut={(target: HTMLInputElement, tabDirection: TabDirection) =>
        data.focusNext(target, tabDirection, RunActions.Mid)
      }
      onNavigate={data.onNavigate}
      animated={false}
    />
  ),
  template: "999999.99",
  width: 4,
});

const SpreadCol = (data: RunColumnData) => ({
  name: "spread",
  header: () => <DualTableHeader label={strings.Spread} />,
  render: ({ id, spread }: RowType) => {
    return (
      <Price
        uid={`run-${id}-spread`}
        value={spread}
        className={"spread"}
        arrow={ArrowDirection.None}
        status={OrderStatus.None}
        onSubmit={(
          input: HTMLInputElement,
          value: number | null,
          changed: boolean
        ) => {
          if (value !== null) {
            data.onSpreadChanged(id, value, changed);
          }
        }}
        onTabbedOut={(target: HTMLInputElement, tabDirection: TabDirection) =>
          data.focusNext(target, tabDirection, RunActions.Spread)
        }
        onNavigate={data.onNavigate}
        animated={false}
      />
    );
  },
  template: "999999.99",
  width: 4,
});

const columns = (data: RunColumnData): ColumnSpec[] => [
  TenorColumn,
  RunSizeColumn(data, "bid"),
  RunPriceColumn(data, "bid"),
  RunPriceColumn(data, "ofr"),
  RunSizeColumn(data, "ofr"),
  MidCol(data),
  SpreadCol(data),
];

export default columns;
