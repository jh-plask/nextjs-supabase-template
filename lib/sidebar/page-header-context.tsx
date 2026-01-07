"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface PageHeaderContextValue {
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActionsState] = useState<ReactNode>(null);

  const setActions = useCallback((newActions: ReactNode) => {
    setActionsState(newActions);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ actions, setActions }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return context;
}

export function PageHeaderActions() {
  const { actions } = usePageHeader();
  return <>{actions}</>;
}

/**
 * Component to set header actions from a page.
 * Actions are cleared on unmount.
 */
export function SetPageActions({ children }: { children: ReactNode }) {
  const { setActions } = usePageHeader();

  useEffect(() => {
    setActions(children);
    return () => setActions(null);
  }, [children, setActions]);

  return null;
}
