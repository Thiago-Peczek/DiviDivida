import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

function RootNavigator() {
  const { isLogged } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isLogged ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
