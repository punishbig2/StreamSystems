import { Workarea } from "components/Workarea";

import "styles/main.scss";

import React from "react";

Object.defineProperty(MouseEvent.prototype, "ignore", {
  value: function () {
    this.preventDefault();
    this.stopImmediatePropagation();
  },
});

const FXOptionsUI: React.FC = () => {
  const { classList } = document.body;
  const theme: string | null = localStorage.getItem("theme");
  if (theme === null) {
    classList.add("default-theme");
  } else {
    classList.add(`${theme}-theme`);
  }
  return <Workarea />;
};

export default FXOptionsUI;
