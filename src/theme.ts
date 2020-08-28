import { createMuiTheme, Theme } from "@material-ui/core";
import { palette } from "palette";

export const theme: Theme = createMuiTheme({
  palette: palette,
  overrides: {
    MuiFormControl: {
      root: {
        padding: 0,
      },
      marginNormal: {
        marginTop: 8,
        marginBottom: 8,
      },
    },
    MuiFormLabel: {
      root: {
        fontFamily: '"Montserrat", sans-serif',
        fontSize: 13,
        fontWeight: 500,
        margin: 0,
        marginBottom: 8,
      },
    },
    MuiListItem: {
      root: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: 15,
      },
    },
    MuiFormHelperText: {
      root: {
        fontFamily: '"Montserrat", sans-serif',
      },
    },
    MuiSelect: {
      select: {
        "&:focus": {
          backgroundColor: "transparent",
        },
      },
    },
    MuiInputBase: {
      root: {
        font: "initial",
        lineHeight: "30px",
        height: 30,
      },
      input: {
        fontFamily: '"Roboto", sans-serif',
        fontWeight: 500,
        fontSize: 15,
      },
    },
  },
  props: {
    MuiSelect: {
      variant: "standard",
    },
  },
});
