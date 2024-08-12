import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AppStackParamList, RootStackParamList } from "../constants/types";
import HomeScreen from "../screens/HomeScreen";

const Navigation = () => {
  return (
    <NavigationContainer >
      <RootNavigator />
    </NavigationContainer>
  );
};

export default Navigation;

const RootNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen
        name="App"
        component={AppStackScreen}
      />
    </RootStack.Navigator>
  );
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const AppStackScreen = () => {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
    </AppStack.Navigator>
  )
}