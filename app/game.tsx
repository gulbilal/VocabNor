import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import words from "../data/words.json";
import {
  getFriendlyAuthError,
  saveCurrentUserHighScore,
} from "../firebase/services";

const ROUND_SIZE = 5;
const MAX_LIVES = 5;

type WordPair = (typeof words)[number];
type Feedback = "correct" | "wrong" | null;

type Round = {
  norwegianWords: WordPair[];
  englishWords: WordPair[];
};

type GameSession = {
  shuffledWords: WordPair[];
  roundStartIndex: number;
  round: Round;
};

function shuffle<T>(items: T[]) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [
      shuffledItems[randomIndex],
      shuffledItems[index],
    ];
  }

  return shuffledItems;
}

function createRound(shuffledWords: WordPair[], startIndex: number): Round {
  const selectedWords = shuffledWords.slice(
    startIndex,
    startIndex + ROUND_SIZE,
  );

  return {
    norwegianWords: selectedWords,
    englishWords: shuffle(selectedWords),
  };
}

function createGameSession(): GameSession {
  const shuffledWords = shuffle(words);

  return {
    shuffledWords,
    roundStartIndex: 0,
    round: createRound(shuffledWords, 0),
  };
}

export default function GameScreen() {
  const [gameSession, setGameSession] = useState<GameSession>(() =>
    createGameSession(),
  );
  const [selectedNorwegianId, setSelectedNorwegianId] = useState<number | null>(
    null,
  );
  const [selectedEnglishId, setSelectedEnglishId] = useState<number | null>(
    null,
  );
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [scoreSaveMessage, setScoreSaveMessage] = useState("");
  const hasSavedScore = useRef(false);

  const roundComplete =
    matchedIds.length === gameSession.round.norwegianWords.length;
  const isGameOver = lives === 0;

  useEffect(() => {
    if (!isGameOver || hasSavedScore.current) {
      return;
    }

    hasSavedScore.current = true;
    setScoreSaveMessage("Saving score...");

    saveCurrentUserHighScore(score)
      .then(() => setScoreSaveMessage("Score saved"))
      .catch((error) => {
        hasSavedScore.current = false;
        setScoreSaveMessage(
          getFriendlyAuthError(error, "Unable to save your score."),
        );
      });
  }, [isGameOver, score]);

  function selectNorwegianWord(id: number) {
    if (isCheckingAnswer || isGameOver) {
      return;
    }

    setSelectedNorwegianId(id);
  }

  function selectEnglishWord(id: number) {
    if (selectedNorwegianId === null || isCheckingAnswer || isGameOver) {
      return;
    }

    const isCorrect = selectedNorwegianId === id;

    setSelectedEnglishId(id);
    setFeedback(isCorrect ? "correct" : "wrong");
    setIsCheckingAnswer(true);

    setTimeout(() => {
      if (isCorrect) {
        setMatchedIds((currentIds) => [...currentIds, id]);
        setScore((currentScore) => currentScore + 1);
      } else {
        setScore((currentScore) => currentScore - 1);
        setLives((currentLives) => currentLives - 1);
      }

      setSelectedNorwegianId(null);
      setSelectedEnglishId(null);
      setFeedback(null);
      setIsCheckingAnswer(false);
    }, 700);
  }

  function startNextRound() {
    const nextRoundStartIndex = gameSession.roundStartIndex + ROUND_SIZE;

    if (nextRoundStartIndex >= words.length) {
      setGameSession(createGameSession());
    } else {
      setGameSession((currentSession) => ({
        ...currentSession,
        roundStartIndex: nextRoundStartIndex,
        round: createRound(currentSession.shuffledWords, nextRoundStartIndex),
      }));
    }

    resetRoundState();
  }

  function restartGame() {
    setGameSession(createGameSession());
    setScore(0);
    setLives(MAX_LIVES);
    setScoreSaveMessage("");
    hasSavedScore.current = false;
    resetRoundState();
  }

  function resetRoundState() {
    setSelectedNorwegianId(null);
    setSelectedEnglishId(null);
    setMatchedIds([]);
    setFeedback(null);
    setIsCheckingAnswer(false);
  }

  function getWordButtonStyle(id: number, language: "norwegian" | "english") {
    const isSelected =
      language === "norwegian"
        ? selectedNorwegianId === id
        : selectedEnglishId === id;

    if (!isSelected) {
      return styles.wordButton;
    }

    if (feedback === "correct") {
      return [styles.wordButton, styles.correctButton];
    }

    if (feedback === "wrong") {
      return [styles.wordButton, styles.wrongButton];
    }

    return [styles.wordButton, styles.selectedButton];
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gameHeader}>
        <Text style={styles.title}>Match the Words</Text>
        <View style={styles.gameStats}>
          <Text style={styles.subtitle}>Score: {score}</Text>
          <Text style={styles.subtitle}>❤️ Remaining: {lives}</Text>
        </View>
      </View>

      {isGameOver ? (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverTitle}>Game Over</Text>
          <Text style={styles.finalScore}>Your score: {score}</Text>
          <Text style={styles.scoreSaveMessage}>{scoreSaveMessage}</Text>
          <Pressable style={styles.newRoundButton} onPress={restartGame}>
            <Text style={styles.newRoundButtonText}>Play Again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.grid}>
            <View style={styles.column}>
              <Text style={styles.columnTitle}>Norwegian</Text>
              {gameSession.round.norwegianWords
                .filter((word) => !matchedIds.includes(word.id))
                .map((word) => (
                  <Pressable
                    key={word.id}
                    style={getWordButtonStyle(word.id, "norwegian")}
                    onPress={() => selectNorwegianWord(word.id)}
                  >
                    <Text adjustsFontSizeToFit style={styles.wordText}>
                      {word.norwegian}
                    </Text>
                  </Pressable>
                ))}
            </View>

            <View style={styles.column}>
              <Text style={styles.columnTitle}>English</Text>
              {gameSession.round.englishWords
                .filter((word) => !matchedIds.includes(word.id))
                .map((word) => (
                  <Pressable
                    key={word.id}
                    style={getWordButtonStyle(word.id, "english")}
                    onPress={() => selectEnglishWord(word.id)}
                  >
                    <Text adjustsFontSizeToFit style={styles.wordText}>
                      {word.english}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>

          {roundComplete && (
            <View style={styles.completeContainer}>
              <Text style={styles.completeText}>Round complete!</Text>
              <Pressable style={styles.newRoundButton} onPress={startNextRound}>
                <Text style={styles.newRoundButtonText}>Start Next Round</Text>
              </Pressable>
            </View>
          )}
        </>
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

  gameHeader: {
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#336699",
  },

  gameStats: {
    alignItems: "center",
    gap: 6,
  },

  grid: {
    flexDirection: "row",
    gap: 16,
  },

  column: {
    flex: 1,
    gap: 14,
  },

  columnTitle: {
    color: "#003366",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  wordButton: {
    height: 60,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#3399ff",
    backgroundColor: "#3399ff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  selectedButton: {
    borderColor: "#003366",
    backgroundColor: "#0066cc",
  },

  correctButton: {
    borderColor: "#16803c",
    backgroundColor: "#20a84f",
  },

  wrongButton: {
    borderColor: "#a82020",
    backgroundColor: "#df3b3b",
  },

  wordText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  completeContainer: {
    alignItems: "center",
    marginTop: 40,
    gap: 16,
  },

  completeText: {
    color: "#16803c",
    fontSize: 22,
    fontWeight: "bold",
  },

  gameOverContainer: {
    alignItems: "center",
    flex: 1,
    gap: 20,
    justifyContent: "center",
  },

  gameOverTitle: {
    color: "#a82020",
    fontSize: 32,
    fontWeight: "bold",
  },

  finalScore: {
    color: "#003366",
    fontSize: 24,
    fontWeight: "bold",
  },

  scoreSaveMessage: {
    color: "#336699",
    textAlign: "center",
  },

  newRoundButton: {
    backgroundColor: "#003366",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },

  newRoundButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
