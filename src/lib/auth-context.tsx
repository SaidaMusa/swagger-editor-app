"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type ClientUser = {
  id: string;
  email: string;
};

type AuthContextValue = {
  user: ClientUser | null;
  setUser: (user: ClientUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser
}: {
  children: React.ReactNode;
  initialUser: ClientUser | null;
}) {
  const [user, setUser] = useState<ClientUser | null>(initialUser);
  const value = useMemo(() => ({ user, setUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
