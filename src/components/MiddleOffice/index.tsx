import React, { ReactElement } from "react";
import { DealBlotter } from "components/MiddleOffice/DealBlotter";
import { DealEntryForm } from "components/MiddleOffice/DealEntryForm";
import { SummaryLegDetailsForm } from "components/MiddleOffice/SummaryLegDetailsForm";
import { LegDetailsForm } from "components/MiddleOffice/LegDetailsForm";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import moment from "moment";
import { Grid } from "@material-ui/core";
import { randomID } from "randomID";

interface Props {
  visible: boolean;
}

const legs: Leg[] = [
  {
    type: "Buy Call",
    notional: 10000000,
    premium: 260330,
    price: 2.603,
    strike: 4.1521,
    vol: 13,
    expiryDate: moment(),
    delta: 0.513001779,
    gamma: 610.925,
    vega: 20019,
    hedge: -5130017,
    dealId: "123435",
    usi: 456789,
  },
  {
    type: "Buy Put",
    notional: 10000000,
    premium: 206020,
    price: 2.06,
    strike: 4.1521,
    vol: 13,
    expiryDate: moment(),
    delta: -0.486854068,
    gamma: 610.925,
    vega: 20018,
    hedge: 4868540,
    dealId: "123435",
    usi: 456789,
  },
  {
    type: "Buy Call",
    notional: 10000000,
    premium: 260330,
    price: 2.603,
    strike: 4.1521,
    vol: 13,
    expiryDate: moment(),
    delta: 0.513001779,
    gamma: 610.925,
    vega: 20019,
    hedge: -5130017,
    dealId: "123435",
    usi: 456789,
  },
  {
    type: "Buy Put",
    notional: 10000000,
    premium: 206020,
    price: 2.06,
    strike: 4.1521,
    vol: 13,
    expiryDate: moment(),
    delta: -0.486854068,
    gamma: 610.925,
    vega: 20018,
    hedge: 4868540,
    dealId: "123435",
    usi: 456789,
  },
];

export const MiddleOffice: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  return (
    <div className={"middle-office" + (!props.visible ? " hidden" : "")}>
      <div className={"left-panel"}>
        <DealBlotter id={randomID("")} />
      </div>
      <Grid className={"right-panel"} container>
        <Grid xs={7} className={"container"} item>
          <div className={"form-group"}>
            <h1>Deal Entry</h1>
            <DealEntryForm />
          </div>
          <div className={"form-group"}>
            <h1>Summary Leg Details</h1>
            <SummaryLegDetailsForm currencies={["USD", "BRL"]} />
          </div>
        </Grid>
        <Grid xs={5} className={"container"} item>
          <LegDetailsForm legs={legs} />
        </Grid>
      </Grid>
    </div>
  );
};
