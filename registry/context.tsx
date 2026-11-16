"use client";

import React, { createContext, useContext } from "react";

interface CardContextValue {
  isInCard: boolean;
}

const CardContext = createContext<CardContextValue>({ isInCard: false });

export function CardProvider({
  children,
  isInCard = true,
}: {
  children: React.ReactNode;
  isInCard?: boolean;
}) {
  return (
    <CardContext.Provider value={{ isInCard }}>
      {children}
    </CardContext.Provider>
  );
}

export function useCardContext() {
  return useContext(CardContext);
}
