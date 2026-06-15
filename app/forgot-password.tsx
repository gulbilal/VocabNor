import { router } from "expo-router";
import React, { useState } from "react";
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
import {
  getFriendlyAuthError,
  requestPasswordReset,
} from "../firebase/services";

const SUCCESS_MESSAGE =
  "If an account exists for that email, a password reset link has been sent.";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordReset() {
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSuccessMessage(SUCCESS_MESSAGE);
    } catch (error) {
      if (
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === "auth/user-not-found"
      ) {
        setSuccessMessage(SUCCESS_MESSAGE);
      } else {
        setErrorMessage(
          getFriendlyAuthError(
            error,
            "Unable to send the password reset email. Please try again.",
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
            Enter your account email and we will send you a reset link.
          </Text>

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={handlePasswordReset}
            placeholder="Email"
            style={styles.input}
            value={email}
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
          {successMessage ? (
            <Text style={styles.successText}>{successMessage}</Text>
          ) : null}

          <Pressable
            disabled={isSubmitting || !email.trim()}
            onPress={handlePasswordReset}
            style={({ pressed }) => [
              styles.button,
              (isSubmitting || !email.trim()) && styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace("/login")}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Log In</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f8ff",
    flex: 1,
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
    fontSize: 28,
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
  backButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#0066cc",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "#a82020",
    textAlign: "center",
  },
  successText: {
    color: "#16803c",
    textAlign: "center",
  },
});
