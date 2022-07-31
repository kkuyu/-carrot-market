import { atom } from "recoil";
import { v1 } from "uuid";

export const HeaderUtils = {
  Address: "address",
  Back: "back",
  Home: "home",
  Kebab: "kebab",
  Share: "share",
  Search: "search",
  Submit: "submit",
  Title: "title",
} as const;
export type HeaderUtils = typeof HeaderUtils[keyof typeof HeaderUtils];

export const NavBarUtils = {
  Home: "home",
  Chat: "chat",
  Profile: "profile",
  Story: "story",
  Streams: "streams",
} as const;
export type NavBarUtils = typeof NavBarUtils[keyof typeof NavBarUtils];

export interface PageLayoutTypes {
  title?: string;
  seoTitle?: string;
  header: {
    headerUtils: HeaderUtils[];
    headerColor?: string;
    kebabActions?: { key: string; text: string; onClick: () => void }[];
    submitId?: string;
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
