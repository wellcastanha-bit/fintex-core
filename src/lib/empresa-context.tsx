"use client";

import { createContext, useContext } from "react";

export type EmpresaCtx = {
  nome: string;
  isHolding: boolean;
  isFatias: boolean;
};

const EmpresaContext = createContext<EmpresaCtx>({
  nome: "",
  isHolding: false,
  isFatias: false,
});

export const EmpresaProvider = EmpresaContext.Provider;

export function useEmpresa(): EmpresaCtx {
  return useContext(EmpresaContext);
}
