import React, { ReactElement } from "react";
import { LegDetailsFields } from "components/MiddleOffice/LegDetailsForm/LegDetailsFields";
import { Leg } from "components/MiddleOffice/interfaces/leg";
import MO from "mobx/stores/moStore";
import { observer } from "mobx-react";
import { PricingResult } from "components/MiddleOffice/interfaces/pricingResult";

interface Props {
  pricingResult: PricingResult | null;
}

export const LegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { pricingResult } = props;
    const { legs } = !!pricingResult ? pricingResult : MO;
    return (
      <form>
        {legs.map((leg: Leg, index: number) => {
          return (
            <fieldset key={index}>
              <legend className={"leg-legend"}>Leg {index + 1}</legend>
              <LegDetailsFields {...leg} />
            </fieldset>
          );
        })}
      </form>
    );
  },
);
