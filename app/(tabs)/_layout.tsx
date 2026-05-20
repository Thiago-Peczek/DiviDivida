import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";

import { useAuth } from "@/contexts/AuthContext";
import { HapticTab } from "../../components/haptic-tab";

export default function TabLayout() {
  const { logout } = useAuth();

  const { isLogged, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isLogged) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#176B52",
        tabBarInactiveTintColor: "#6D746F",
      }}
    >
      <Tabs.Screen
        name="groups"
        options={{
          title: "Grupos",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="extrato"
        options={{
          title: "Extrato",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
