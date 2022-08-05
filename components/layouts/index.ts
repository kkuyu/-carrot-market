export interface LayoutState {
  header: HeaderOptions;
  navBar: NavBarOptions;
}
export interface LayoutDispatch {
  change: (state: LayoutState) => void;
  reset: () => void;
}

// header
export interface HeaderOptions {
  utils: HeaderUtils[];
  title?: string;
  titleTag?: "h1"|"strong";
  bgColor?: string;
  kebabActions?: { key: string; text: string; onClick: () => void }[];
  submitId?: string;
}
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

// navBar
export interface NavBarOptions {
  utils: NavBarUtils[];
}
export const NavBarUtils = {
  Home: "home",
  Chat: "chat",
  Profile: "profile",
  Story: "story",
  Streams: "streams",
} as const;
export type NavBarUtils = typeof NavBarUtils[keyof typeof NavBarUtils];
