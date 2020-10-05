import { Grid } from "@material-ui/core";
import { FormField } from "components/FormField";
import { Commission } from "components/MiddleOffice/types/deal";
import React, { useEffect, useState } from "react";

interface Props {
  readonly disabled: boolean;
  readonly buyerCommission: Commission;
  readonly sellerCommission: Commission;
}

export const BrokerSection: React.FC<Props> = (
  props: Props
): React.ReactElement<Props> => {
  const { buyerCommission, sellerCommission } = props;
  const [totalCommission, setTotalCommission] = useState<number | null>(null);
  useEffect(() => {
    if (buyerCommission.value === null || sellerCommission.value === null) {
      setTotalCommission(null);
    } else {
      setTotalCommission(buyerCommission.value + sellerCommission.value);
    }
  }, [buyerCommission, sellerCommission]);
  return (
    <Grid alignItems={"stretch"} container>
      <fieldset className={"group"} disabled={props.disabled}>
        <legend>Brokerage</legend>
        <FormField
          label={"Buyer Brokerage Rate"}
          color={"grey"}
          value={buyerCommission.rate}
          name={"brokerageRate"}
          type={"number"}
          precision={2}
          disabled={props.disabled}
        />
        <FormField
          label={"Seller Brokerage Rate"}
          color={"grey"}
          value={sellerCommission.rate}
          name={"brokerageRate"}
          type={"number"}
          precision={2}
          disabled={props.disabled}
        />

        <FormField
          label={"Buyer Comm"}
          color={"grey"}
          value={buyerCommission.value}
          name={"buyerComm"}
          type={"currency"}
          currency={"USD"}
          precision={2}
          disabled={props.disabled}
        />
        <FormField
          label={"Seller Comm"}
          color={"grey"}
          value={sellerCommission.value}
          name={"sellerComm"}
          type={"currency"}
          currency={"USD"}
          precision={2}
          disabled={props.disabled}
        />
        <FormField
          label={"Total Comm"}
          color={"grey"}
          value={totalCommission}
          name={"totalComm"}
          type={"currency"}
          currency={"USD"}
          precision={2}
          disabled={props.disabled}
        />
      </fieldset>
    </Grid>
  );
};
