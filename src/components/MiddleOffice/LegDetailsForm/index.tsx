import React, { ReactElement } from "react";
import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import middleOfficeStore from "mobx/stores/middleOfficeStore";
import { observer } from "mobx-react";
import { NoDataMessage } from "components/noDataMessage";
import { PricingResult } from "components/MiddleOffice/interfaces/pricingResult";

interface Props {
  pricingResult: PricingResult | null;
}

export const LegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { legs } = middleOfficeStore;
    const { pricingResult } = props;
    const pricingResultLegs = pricingResult !== null ? pricingResult.legs : [];
    if (legs.length === 0) {
      return <NoDataMessage />;
    }
    return (
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset key={index}>
              <legend className={"leg-legend"}>Leg {index + 1}</legend>
              <LegDetailsFields {...leg} {...pricingResultLegs[index]} />
            </fieldset>
          );
        })}
      </form>
    );
  }
);
