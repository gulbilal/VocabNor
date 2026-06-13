import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FirebaseAuth from "firebase/auth";
import { Platform } from "react-native";
import { firebaseApp } from "./config";

type ReactNativeFirebaseAuth = typeof FirebaseAuth & {
  getReactNativePersistence: (
    storage: typeof AsyncStorage,
  ) => FirebaseAuth.Persistence;
};

function createAuth() {
  if (Platform.OS === "web") {
    return FirebaseAuth.getAuth(firebaseApp);
  }

  try {
    const { getReactNativePersistence } =
      FirebaseAuth as ReactNativeFirebaseAuth;

    return FirebaseAuth.initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return FirebaseAuth.getAuth(firebaseApp);
  }
}

export const auth = createAuth();
