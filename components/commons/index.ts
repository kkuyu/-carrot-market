// common
const CommonType = {
  Modal: "Modal",
  Panel: "Panel",
  Toast: "Toast",
} as const;
type CommonType = typeof CommonType[keyof typeof CommonType];

export interface CommonStructure {
  Type: CommonType;
  Component: (...args: any[]) => JSX.Element;
  name: string;
  props: {
    [key: string]: any;
  };
}
export interface CommonDispatch {
  open: <T>(Type: CommonStructure["Type"], Component: CommonStructure["Component"], name: CommonStructure["name"], props: CommonStructure["props"] & T) => void;
  close: (Type: CommonStructure["Type"], Component: CommonStructure["Component"], name: CommonStructure["name"]) => void;
}
export type CommonState = Map<CommonType, CommonStructure[]>;

// modal
export interface ModalInitialProps {}
export interface ModalStructure extends CommonStructure {
  Type: "Modal";
  props: ModalInitialProps;
}
export interface ModalComponentProps extends ModalInitialProps {
  name: string;
  onOpen: () => void;
  onClose: () => void;
}

// panel
export interface PanelInitialProps {}
export interface PanelStructure extends CommonStructure {
  Type: "Panel";
  props: PanelInitialProps;
}
export interface PanelComponentProps extends PanelInitialProps {
  name: string;
  onOpen: () => void;
  onClose: () => void;
}

// toast
export interface ToastInitialProps {
  placement: "top" | "bottom";
  isAutoHide?: boolean;
  duration?: number;
  delay?: number;
}
export interface ToastStructure extends CommonStructure {
  Type: "Toast";
  props: ToastInitialProps;
}
export interface ToastComponentProps extends ToastInitialProps {
  name: string;
  onOpen: () => void;
  onClose: () => void;
}
