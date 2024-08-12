import { NavigatorScreenParams } from "@react-navigation/native";

export type RootStackParamList = {
  App: NavigatorScreenParams<AppStackParamList> | undefined;
};

export type AppStackParamList = { 
  Home: undefined
}