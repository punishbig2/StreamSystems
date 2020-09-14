import { Grid } from "@material-ui/core";
import { Commission } from "components/MiddleOffice/types/deal";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { BrokerSection } from "components/MiddleOffice/SummaryLegDetailsForm/brokerSection";
import { DealOutputSection } from "components/MiddleOffice/SummaryLegDetailsForm/dealOutputSection";
import { fieldMapper } from "components/MiddleOffice/SummaryLegDetailsForm/fieldMapper";
import { fields } from "components/MiddleOffice/SummaryLegDetailsForm/fields";
import { NoDataMessage } from "components/noDataMessage";
import { observer } from "mobx-react";
import { DealEntryStore } from "mobx/stores/dealEntryStore";
import moStore, { MOStatus } from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useState } from "react";

interface Props {
  dealEntryStore: DealEntryStore;
  summaryLeg: SummaryLeg | null;
}

const initialCommission: Commission = {
  rate: null,
  value: null,
};

export const SummaryLegDetailsForm: React.FC<Props> = observer(
  (props: Props): ReactElement | null => {
    const { summaryLeg } = props;
    const { entry } = props.dealEntryStore;
    const { premstyle } = entry;
    const [buyerCommission, setBuyerCommission] = useState<Commission>(
      initialCommission
    );
    const [sellerCommission, setSellerCommission] = useState<Commission>(
      initialCommission
    );
    useEffect(() => {
      const { commissions } = entry;
      if (commissions === null || commissions === undefined) return;
      setBuyerCommission(commissions.buyer);
      setSellerCommission(commissions.seller);
    }, [entry]);
    if (summaryLeg === null) {
      return <NoDataMessage />;
    }
    const { dealOutput } = summaryLeg;
    const disabled: boolean = moStore.status !== MOStatus.Normal;
    const ignore = (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
    };
    return (
      <>
        <form onSubmit={ignore}>
          <Grid container>
            <Grid alignItems={"stretch"} container item>
              <fieldset className={"group"} disabled={disabled}>
                {fields.map(fieldMapper(props.dealEntryStore, summaryLeg))}
              </fieldset>
            </Grid>
            <BrokerSection
              buyerCommission={buyerCommission}
              sellerCommission={sellerCommission}
              disabled={disabled}
            />
            <DealOutputSection
              dealOutput={dealOutput}
              disabled={disabled}
              entry={entry}
              premiumStyle={premstyle}
            />
          </Grid>
        </form>
      </>
    );
  }
);
