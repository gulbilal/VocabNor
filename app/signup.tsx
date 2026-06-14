import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getFriendlyAuthError, validateUsername } from "../firebase/services";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const { googleError, isGoogleLoading, isGoogleReady, signInWithGoogle } =
    useGoogleSignIn();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (googleError) {
      setErrorMessage(googleError);
    }
  }, [googleError]);

  async function handleSignup() {
    setErrorMessage("");

    try {
      validateUsername(username);

      if (password.length < 6) {
        throw new Error("Password must contain at least 6 characters.");
      }

      setIsSubmitting(true);
      await signUp(email, password, username);
    } catch (error) {
      setErrorMessage(
        error instanceof Error &&
          error.message === "Password must contain at least 6 characters."
          ? error.message
          : getFriendlyAuthError(
              error,
              "Unable to create your account. Please try again.",
            ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setErrorMessage("");
    await signInWithGoogle();
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start practicing Norwegian words</Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="username"
            onChangeText={setUsername}
            placeholder="Username"
            style={styles.input}
            value={username}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            style={styles.input}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            autoComplete="new-password"
            onChangeText={setPassword}
            onSubmitEditing={handleSignup}
            placeholder="Password (at least 6 characters)"
            secureTextEntry
            style={styles.input}
            value={password}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={isSubmitting || !username || !email || !password}
            onPress={handleSignup}
            style={({ pressed }) => [
              styles.button,
              (isSubmitting || !username || !email || !password) &&
                styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            disabled={isGoogleLoading || !isGoogleReady}
            onPress={handleGoogleSignup}
            style={({ pressed }) => [
              styles.googleButton,
              (isGoogleLoading || !isGoogleReady) && styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#0066cc" />
            ) : (
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            )}
          </Pressable>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" style={styles.linkText}>
              Log in
            </Link>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    gap: 16,
  },
  title: {
    color: "#003366",
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: "#336699",
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderColor: "#3399ff",
    borderRadius: 10,
    borderWidth: 2,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#3399ff",
    borderRadius: 10,
    height: 56,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  googleButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#3399ff",
    borderRadius: 10,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
  },
  googleButtonText: {
    color: "#0066cc",
    fontSize: 18,
    fontWeight: "bold",
  },
  divider: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  dividerLine: {
    backgroundColor: "#b8d8f0",
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: "#336699",
  },
  errorText: {
    color: "#a82020",
    textAlign: "center",
  },
  footerText: {
    color: "#336699",
    textAlign: "center",
  },
  linkText: {
    color: "#0066cc",
    fontWeight: "bold",
  },
});
