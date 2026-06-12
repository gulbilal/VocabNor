import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VocabNor 🇳🇴</Text>
        <Text style={styles.subtitle}>Your Ultimate Learning Companion</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => router.push("/game")}>
          <Text style={styles.buttonText}>Start Game</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => alert("Feature Coming Soon: Leaderboard")}
        >
          <Text style={styles.buttonText}>Leaderboard</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => alert("Feature Coming Soon: Instructions")}
        >
          <Text style={styles.buttonText}>Instructions</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => alert("Feature Coming Soon: Settings")}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 50,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#336699",
  },

  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },

  button: {
    backgroundColor: "#3399ff",
    width: "80%",
    height: 60,
    borderRadius: 10,
    justifyContent: "center",
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
});
