import { createContext, useContext, useEffect, useState } from "react";
import {
  aoMudarEstadoAuth,
  cadastrar,
  entrar,
  obterSessao,
  sair,
} from "../services/authService";

type AuthContextType = {
  isLogged: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    nome: string,
    email: string,
    password: string,
    imagem?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLogged, setIsLogged] = useState(false);

  useEffect(() => {
    obterSessao().then((session) => {
      setIsLogged(!!session);
    });

    const { data: listener } = aoMudarEstadoAuth((_event, session) => {
      setIsLogged(!!session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await entrar(email, password);
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

  return (
    <AuthContext.Provider value={{ isLogged, login, register, logout }}>
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
