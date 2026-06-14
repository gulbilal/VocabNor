import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  FriendlyError,
  getFriendlyAuthError,
  signInWithGoogleIdToken,
} from "../firebase/services";

WebBrowser.maybeCompleteAuthSession();

function isConfigured(value: string | undefined) {
  return Boolean(value && !value.startsWith("YOUR_"));
}

export function useGoogleSignIn() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      androidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ??
        "YOUR_GOOGLE_ANDROID_CLIENT_ID",
      iosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
        "YOUR_GOOGLE_IOS_CLIENT_ID",
      webClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
        "YOUR_GOOGLE_WEB_CLIENT_ID",
      selectAccount: true,
    },
  );

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type === "cancel" || response.type === "dismiss") {
      setGoogleError("Google sign-in was cancelled.");
      setIsGoogleLoading(false);
      return;
    }

    if (response.type !== "success") {
      setGoogleError("Google sign-in could not be completed.");
      setIsGoogleLoading(false);
      return;
    }

    const idToken = response.params.id_token;

    if (!idToken) {
      setGoogleError("Google did not return a valid sign-in token.");
      setIsGoogleLoading(false);
      return;
    }

    signInWithGoogleIdToken(idToken)
      .catch((error) => {
        setGoogleError(
          getFriendlyAuthError(error, "Unable to continue with Google."),
        );
      })
      .finally(() => setIsGoogleLoading(false));
  }, [response]);

  async function signInWithGoogle() {
    setGoogleError("");
    setIsGoogleLoading(true);

    try {
      await promptAsync();
    } catch (error) {
      setGoogleError(
        getFriendlyAuthError(
          error,
          new FriendlyError("Unable to open Google sign-in.").message,
        ),
      );
      setIsGoogleLoading(false);
    }
  }

  const platformClientId =
    Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
      : Platform.OS === "ios"
        ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
        : process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  return {
    googleError,
    isGoogleLoading,
    isGoogleReady: Boolean(request && isConfigured(platformClientId)),
    signInWithGoogle,
  };
}
