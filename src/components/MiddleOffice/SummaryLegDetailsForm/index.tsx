import { Grid } from "@material-ui/core";
import { BrokerSection } from "components/MiddleOffice/SummaryLegDetailsForm/brokerSection";
import { DealOutputSection } from "components/MiddleOffice/SummaryLegDetailsForm/dealOutputSection";
import { fieldMapper } from "components/MiddleOffice/SummaryLegDetailsForm/fieldMapper";
import { fields } from "components/MiddleOffice/SummaryLegDetailsForm/fields";
import { Commission } from "components/MiddleOffice/types/deal";
import { SummaryLeg } from "components/MiddleOffice/types/summaryLeg";
import { NoDataMessage } from "components/noDataMessage";
import moStore, { MoStatus } from "mobx/stores/moStore";
import React, { ReactElement, useEffect, useState } from "react";
import { DealEntry } from "structures/dealEntry";

interface Props {
  readonly dealEntry: DealEntry;
  readonly summaryLeg: SummaryLeg | null;
  readonly isEditMode: boolean;
  readonly isLoading: boolean;
}

const initialCommission: Commission = {
  rate: null,
  value: null,
};

export const SummaryLegDetailsForm: React.FC<Props> = (
  props: Props
): ReactElement | null => {
  const { summaryLeg } = props;
  const { premstyle } = props.dealEntry;
  const [buyerCommission, setBuyerCommission] = useState<Commission>(
    initialCommission
  );
  const [sellerCommission, setSellerCommission] = useState<Commission>(
    initialCommission
  );
  useEffect(() => {
    const { commissions } = props.dealEntry;
    if (commissions === null || commissions === undefined) return;
    setBuyerCommission(commissions.buyer);
    setSellerCommission(commissions.seller);
  }, [props.dealEntry]);
  if (summaryLeg === null) {
    return <NoDataMessage />;
  }
  const { dealOutput } = summaryLeg;
  const disabled: boolean = moStore.status !== MoStatus.Normal;
  const ignore = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
  };
  return (
    <>
      <form onSubmit={ignore}>
        <Grid container>
          <Grid alignItems={"stretch"} container item>
            <fieldset className={"group"} disabled={disabled}>
              {fields.map(
                fieldMapper(
                  {
                    entry: props.dealEntry,
                    isEditMode: props.isEditMode,
                  },
                  summaryLeg
                )
              )}
            </fieldset>
          </Grid>
          <BrokerSection
            buyerCommission={buyerCommission}
            sellerCommission={sellerCommission}
            disabled={disabled}
          />
          <DealOutputSection
            dealEntry={props.dealEntry}
            dealOutput={dealOutput}
            disabled={disabled}
            premiumStyle={premstyle}
          />
        </Grid>
      </form>
    </>
  );
};
