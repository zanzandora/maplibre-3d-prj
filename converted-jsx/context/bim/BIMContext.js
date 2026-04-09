import { createContext, useContext } from "react";

export const BIMContext = createContext(undefined);

export const useBIMContext = () => {
  const context = useContext(BIMContext);
  if (!context) {
    throw new Error("useBIMEngine must be used within a BIMProvider");
  }
  return context;
};
