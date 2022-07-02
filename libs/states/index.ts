import { atom } from "recoil";
import { v1 } from "uuid";

export const HeaderUtils = {
  Address: "address",
  Back: "back",
  Home: "home",
  Search: "search",
  Title: "title",
  Submit: "submit",
} as const;
export type HeaderUtils = typeof HeaderUtils[keyof typeof HeaderUtils];

export const NavBarUtils = {
  Community: "community",
  Home: "home",
  Inbox: "inbox",
  Profile: "profile",
  Streams: "streams",
} as const;
export type NavBarUtils = typeof NavBarUtils[keyof typeof NavBarUtils];

interface PageLayoutTypes {
  title?: string;
  seoTitle?: string;
  header: {
    submitId?: string;
    headerUtils: HeaderUtils[];
  };
  navBar: {
    navBarUtils: NavBarUtils[];
  };
}

export const PageLayout = atom<PageLayoutTypes>({
  key: `pageLayout/${v1()}`,
  default: {
    title: "",
    seoTitle: "",
    header: {
      headerUtils: [],
    },
    navBar: {
      navBarUtils: [],
    },
  },
});
