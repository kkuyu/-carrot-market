import { MetaOptions } from "@components/layouts/meta/metaWrapper";
import { HeaderOptions } from "@components/layouts/header/headerWrapper";
import { NavBarOptions } from "@components/layouts/navBar/navBarWrapper";

export interface LayoutState {
  meta?: MetaOptions;
  header?: HeaderOptions;
  navBar?: NavBarOptions;
}
export interface LayoutDispatch {
  change: (state: LayoutState) => void;
}
