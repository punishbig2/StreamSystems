import { makeStyles } from "@material-ui/core";

export const useTicketClasses = makeStyles({
  formControl: {
    marginTop: 8,
    marginBottom: 0,
    width: "100%",
  },
  outlinedInput: {
    "& input": {
      textAlign: "center",
    },
  },
  formHelperText: {
    marginTop: 4,
    marginBottom: 0,
    fontWeight: 600,
  },
  select: {
    width: "100%",
  },
});
