import { Redirect, Stack } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout() {
  const { isLogged, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isLogged) {
    return <Redirect href={"/(tabs)/grupos" as any} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
