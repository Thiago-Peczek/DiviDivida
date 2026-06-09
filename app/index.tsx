import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { isLogged, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (isLogged) {
    return <Redirect href={"/(tabs)/grupos" as any} />;
  }

  return <Redirect href="/(auth)/login" />;
}
