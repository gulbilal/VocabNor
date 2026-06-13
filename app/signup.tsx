import { Link } from "expo-router";
import { FirebaseError } from "firebase/app";
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
import { useAuth } from "../context/AuthContext";

function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    return error.message.replace("Firebase: ", "");
  }

  return "Unable to create your account. Please try again.";
}

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup() {
    setErrorMessage("");

    if (password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start practicing Norwegian words</Text>

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
            disabled={isSubmitting || !email || !password}
            onPress={handleSignup}
            style={({ pressed }) => [
              styles.button,
              (isSubmitting || !email || !password) && styles.disabledButton,
              pressed && styles.pressedButton,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
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
