import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { Commission } from "components/MiddleOffice/interfaces/deal";
import { SummaryLeg } from "components/MiddleOffice/interfaces/summaryLeg";
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
    const { deal } = moStore;
    const [buyerCommission, setBuyerCommission] = useState<Commission>(
      initialCommission
    );
    const [sellerCommission, setSellerCommission] = useState<Commission>(
      initialCommission
    );
    const [totalCommission, setTotalCommission] = useState<number | null>(null);
    useEffect(() => {
      if (deal === null) return;
      const { commissions } = deal;
      if (commissions === null || commissions === undefined) return;
      setBuyerCommission(commissions.buyer);
      setSellerCommission(commissions.seller);
    }, [deal]);
    useEffect(() => {
      if (buyerCommission.value === null || sellerCommission.value === null) {
        setTotalCommission(null);
      } else {
        setTotalCommission(buyerCommission.value + sellerCommission.value);
      }
    }, [buyerCommission, sellerCommission]);

    if (props.summaryLeg === null) {
      return <NoDataMessage />;
    }
    const { dealOutput } = props.summaryLeg;
    const disabled: boolean = moStore.status !== MOStatus.Normal;
    const ignore = (event: React.FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
    };
    return (
      <>
        <form onSubmit={ignore}>
          <Grid container>
            <Grid alignItems={"stretch"} container item>
              <fieldset disabled={disabled}>
                {fields.map(
                  fieldMapper(props.dealEntryStore, props.summaryLeg)
                )}
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset disabled={disabled}>
                <legend>Brokerage</legend>
                <FormField
                  label={"Buyer Brokerage Rate"}
                  color={"grey"}
                  value={buyerCommission.rate}
                  name={"brokerageRate"}
                  type={"number"}
                  precision={4}
                  disabled={disabled}
                />
                <FormField
                  label={"Seller Brokerage Rate"}
                  color={"grey"}
                  value={sellerCommission.rate}
                  name={"brokerageRate"}
                  type={"number"}
                  precision={4}
                  disabled={disabled}
                />

                <FormField
                  label={"Buyer Comm"}
                  color={"grey"}
                  value={buyerCommission.value}
                  name={"buyerComm"}
                  type={"currency"}
                  currency={"USD"}
                  precision={2}
                  disabled={disabled}
                />
                <FormField
                  label={"Seller Comm"}
                  color={"grey"}
                  value={sellerCommission.value}
                  name={"sellerComm"}
                  type={"currency"}
                  currency={"USD"}
                  precision={2}
                  disabled={disabled}
                />
                <FormField
                  label={"Total Comm"}
                  color={"grey"}
                  value={totalCommission}
                  name={"totalComm"}
                  type={"currency"}
                  currency={"USD"}
                  precision={2}
                  disabled={disabled}
                />
              </fieldset>
            </Grid>
            <Grid alignItems={"stretch"} container>
              <fieldset disabled={disabled}>
                <legend>Deal Output</legend>
                <FormField
                  label={"Net Premium"}
                  color={"grey"}
                  value={dealOutput.premium}
                  name={"netPremium"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
                <FormField
                  label={"Price %"}
                  color={"grey"}
                  value={dealOutput.pricePercent}
                  name={"pricePercent"}
                  type={"number"}
                  precision={4}
                  disabled={disabled}
                />
                <FormField
                  label={"Delta"}
                  color={"grey"}
                  value={dealOutput.delta}
                  name={"delta"}
                  type={"number"}
                  precision={8}
                  disabled={disabled}
                />
                <FormField
                  label={"Gamma"}
                  color={"grey"}
                  value={dealOutput.gamma}
                  name={"gamma"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
                <FormField
                  label={"Net Vega"}
                  color={"grey"}
                  value={dealOutput.vega}
                  name={"vega"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
                <FormField
                  label={"Net Hedge"}
                  color={"grey"}
                  value={dealOutput.hedge}
                  name={"hedge"}
                  type={"currency"}
                  currency={dealOutput.premiumCurrency}
                  disabled={disabled}
                />
              </fieldset>
            </Grid>
          </Grid>
          <div className={"button-box"}>
            <button type={"button"} className={"primary"}>
              Add Leg
            </button>
          </div>
        </form>
      </>
    );
  }
);
