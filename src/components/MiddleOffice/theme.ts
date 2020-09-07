import { createMuiTheme } from "@material-ui/core";
import { fade } from "@material-ui/core/styles";
import { Palette } from "@material-ui/core/styles/createPalette";
import workareaStore from "mobx/stores/workareaStore";
import { getPalette } from "palette";

const { preferences } = workareaStore;

const labelWidth: string = "35%";
const fieldSize: number = 25;
const palette: Palette = getPalette(preferences.theme);

export default createMuiTheme({
  spacing: 4,
  palette: {
    ...palette,
    primary: {
      ...palette.primary,
      main: "#a0a0a0",
      light: "#808080",
    },
  },
  overrides: {
    MuiMenuItem: {
      root: {
        fontSize: 13,
        fontWeight: 600,
      },
    },
    MuiOutlinedInput: {
      root: {
        borderRadius: 0,
      },
      input: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 8,
        paddingRight: 8,
        height: fieldSize,
        lineHeight: fieldSize + "px",
      },
      notchedOutline: {
        borderRadius: 3,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "inherit",
      },
    },
    MuiSelect: {
      selectMenu: {
        height: fieldSize,
        lineHeight: fieldSize + "px",
      },
      iconOutlined: {
        fill: "inherit",
      },
    },
    MuiInputBase: {
      root: {
        fontFamily: "'Roboto', sans-serif",
        fontWeight: 600,
        fontSize: 13,
        color: "inherit",
        height: fieldSize,
        lineHeight: fieldSize + "px",
        flex: 1,
        marginTop: 3,
        marginBottom: 3,
        "&$error": {
          backgroundColor: fade(palette.error.main, 0.1),
          color: palette.error.main,
        },
      },
      input: {
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
    MuiFormLabel: {
      root: {
        fontFamily: "'Montserrat', sans-serif",
        minWidth: labelWidth,
        maxWidth: labelWidth,
        fontWeight: 500,
        fontSize: 13,
        color: "inherit",
      },
    },
  },
  props: {
    MuiTextField: {
      variant: "outlined",
      label: null,
    },
    MuiSelect: {
      variant: "outlined",
    },
  },
});
