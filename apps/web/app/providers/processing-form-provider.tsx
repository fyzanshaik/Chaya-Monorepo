"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useProcessingFormStore } from "../stores/processing-form";

interface ProcessingFormContextType {
  procurementId: number;
}

const ProcessingFormContext = createContext<
  ProcessingFormContextType | undefined
>(undefined);

interface ProcessingFormProviderProps {
  children: ReactNode;
  procurementId: number;
}

export function ProcessingFormProvider({
  children,
  procurementId,
}: ProcessingFormProviderProps) {
  const { initializeForm } = useProcessingFormStore();

  useEffect(() => {
    initializeForm(procurementId);
  }, [procurementId, initializeForm]);

  return (
    <ProcessingFormContext.Provider value={{ procurementId }}>
      {children}
    </ProcessingFormContext.Provider>
  );
}

export function useProcessingFormContext() {
  const context = useContext(ProcessingFormContext);
  if (context === undefined) {
    throw new Error(
      "useProcessingFormContext must be used within a ProcessingFormProvider"
    );
  }
  return context;
}
