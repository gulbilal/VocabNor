import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getCurrentUserHighScores,
  getFriendlyAuthError,
  type HighScore,
} from "../firebase/services";

export default function HighScoreScreen() {
  const [scores, setScores] = useState<HighScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadScores = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setScores(await getCurrentUserHighScores());
    } catch (error) {
      setErrorMessage(
        getFriendlyAuthError(error, "Unable to load high scores."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadScores();
    }, [loadScores]),
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Your Top 5 Scores</Text>

      {isLoading ? (
        <ActivityIndicator color="#3399ff" size="large" />
      ) : errorMessage ? (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={loadScores}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      ) : scores.length === 0 ? (
        <Text style={styles.emptyText}>No scores yet. Finish a game first!</Text>
      ) : (
        <View style={styles.scoreList}>
          {scores.map((entry, index) => (
            <View
              key={`${entry.createdAt.toMillis()}-${index}`}
              style={styles.scoreRow}
            >
              <Text style={styles.rank}>#{index + 1}</Text>
              <Text style={styles.score}>{entry.score}</Text>
              <Text style={styles.date}>
                {entry.createdAt.toDate().toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f8ff",
    padding: 20,
  },
  title: {
    color: "#003366",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  scoreList: {
    gap: 14,
  },
  scoreRow: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#3399ff",
    borderRadius: 10,
    borderWidth: 2,
    flexDirection: "row",
    padding: 18,
  },
  rank: {
    color: "#0066cc",
    fontSize: 18,
    fontWeight: "bold",
    width: 45,
  },
  score: {
    color: "#003366",
    flex: 1,
    fontSize: 22,
    fontWeight: "bold",
  },
  date: {
    color: "#336699",
  },
  messageContainer: {
    alignItems: "center",
    gap: 18,
  },
  emptyText: {
    color: "#336699",
    fontSize: 17,
    textAlign: "center",
  },
  errorText: {
    color: "#a82020",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#3399ff",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
