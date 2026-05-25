import { createContext, useContext, useEffect, useState } from "react";
import {
  aoMudarEstadoAuth,
  cadastrar,
  entrar,
  obterSessao,
  sair,
} from "../services/authService";
import { obterPerfil } from "../services/userService";
import type { Usuario } from "../types/database";

type AuthContextType = {
  isLogged: boolean;
  isLoading: boolean;
  userId: string | null;
  profile: Usuario | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    nome: string,
    email: string,
    password: string,
    imagem?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);

  const loadProfile = async (uid: string) => {
    try {
      const p = await obterPerfil(uid);
      setProfile(p);
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    obterSessao().then(async (session) => {
      setIsLogged(!!session);
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) await loadProfile(uid);
      setIsLoading(false);
    });

    const { data: listener } = aoMudarEstadoAuth(async (_event, session) => {
      setIsLogged(!!session);
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        await loadProfile(uid);
      } else {
        setProfile(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const data = await entrar(email, password);
  };

  const register = async (
    nome: string,
    email: string,
    password: string,
    imagem?: string,
  ) => {
    await cadastrar(nome, email, password, imagem);
  };

  const logout = async () => {
    await sair();
  };

  const refreshProfile = async () => {
    if (userId) await loadProfile(userId);
  };

  return (
    <AuthContext.Provider
      value={{
        isLogged,
        isLoading,
        userId,
        profile,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth deve ser usado dentro do AuthProvider");
  return context;
};
