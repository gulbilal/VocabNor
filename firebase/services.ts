import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  runTransaction,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { auth } from "./auth";
import { db } from "./config";

export type AuthProviderName = "password" | "google";

export type HighScore = {
  score: number;
  createdAt: Timestamp;
};

export class FriendlyError extends Error {}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string) {
  const trimmedUsername = username.trim();

  if (!trimmedUsername) {
    throw new FriendlyError("Username is required.");
  }

  if (trimmedUsername.length < 3) {
    throw new FriendlyError("Username must contain at least 3 characters.");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
    throw new FriendlyError(
      "Username can only contain letters, numbers, and underscores.",
    );
  }

  return {
    username: trimmedUsername,
    usernameLower: normalizeUsername(trimmedUsername),
  };
}

function createProfileData(
  user: User,
  username: string,
  usernameLower: string,
  authProvider: AuthProviderName,
  now: Timestamp,
) {
  return {
    uid: user.uid,
    username,
    usernameLower,
    email: user.email ?? "",
    authProvider,
    createdAt: now,
    updatedAt: now,
  };
}

async function claimUsernameAndCreateProfile(
  user: User,
  username: string,
  authProvider: AuthProviderName,
) {
  const validatedUsername = validateUsername(username);
  const usernameRef = doc(db, "usernames", validatedUsername.usernameLower);
  const userRef = doc(db, "users", user.uid);

  await runTransaction(db, async (transaction) => {
    const [usernameSnapshot, userSnapshot] = await Promise.all([
      transaction.get(usernameRef),
      transaction.get(userRef),
    ]);

    if (userSnapshot.exists()) {
      return;
    }

    if (usernameSnapshot.exists()) {
      throw new FriendlyError("Username already taken.");
    }

    const now = Timestamp.now();

    transaction.set(
      userRef,
      createProfileData(
        user,
        validatedUsername.username,
        validatedUsername.usernameLower,
        authProvider,
        now,
      ),
    );
    transaction.set(usernameRef, {
      uid: user.uid,
      username: validatedUsername.username,
      createdAt: now,
    });
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string,
) {
  const validatedUsername = validateUsername(username);
  const usernameRef = doc(db, "usernames", validatedUsername.usernameLower);

  if ((await getDoc(usernameRef)).exists()) {
    throw new FriendlyError("Username already taken.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );

  try {
    await claimUsernameAndCreateProfile(
      credential.user,
      validatedUsername.username,
      "password",
    );
  } catch (error) {
    await deleteUser(credential.user).catch(() => signOut(auth));
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

function generateBaseUsername(user: User) {
  const source = user.displayName || user.email?.split("@")[0] || "user";
  const normalized = source
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return normalized.length >= 3 ? normalized : `user_${normalized || "new"}`;
}

async function ensureGoogleProfile(user: User) {
  const userRef = doc(db, "users", user.uid);

  if ((await getDoc(userRef)).exists()) {
    return;
  }

  const baseUsername = generateBaseUsername(user);

  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = attempt === 0 ? "" : `${Math.floor(1000 + Math.random() * 9000)}`;
    const candidate = `${baseUsername}${suffix}`;

    try {
      await claimUsernameAndCreateProfile(user, candidate, "google");
      return;
    } catch (error) {
      if (
        error instanceof FriendlyError &&
        error.message === "Username already taken."
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new FriendlyError("Unable to create a unique username. Try again.");
}

export async function signInWithGoogleIdToken(idToken: string) {
  const googleCredential = GoogleAuthProvider.credential(idToken);
  const credential = await signInWithCredential(auth, googleCredential);

  try {
    await ensureGoogleProfile(credential.user);
  } catch (error) {
    await signOut(auth).catch(() => undefined);
    throw error;
  }
}

function parseScores(data: DocumentData | undefined): HighScore[] {
  if (!Array.isArray(data?.scores)) {
    return [];
  }

  return data.scores
    .filter(
      (item): item is HighScore =>
        typeof item?.score === "number" && item.createdAt instanceof Timestamp,
    )
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

export async function getCurrentUserHighScores() {
  const user = auth.currentUser;

  if (!user) {
    return [];
  }

  const scoresRef = doc(db, "users", user.uid, "highScores", "scores");
  const snapshot = await getDoc(scoresRef);

  return snapshot.exists() ? parseScores(snapshot.data()) : [];
}

export async function saveCurrentUserHighScore(score: number) {
  const user = auth.currentUser;

  if (!user) {
    throw new FriendlyError("Log in before saving a score.");
  }

  const scoresRef = doc(db, "users", user.uid, "highScores", "scores");

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(scoresRef);
    const scores = snapshot.exists() ? parseScores(snapshot.data()) : [];
    const updatedScores = [...scores, { score, createdAt: Timestamp.now() }]
      .sort((first, second) => second.score - first.score)
      .slice(0, 5);

    transaction.set(scoresRef, {
      scores: updatedScores,
      updatedAt: Timestamp.now(),
    });
  });
}

export function getFriendlyAuthError(error: unknown, fallback: string) {
  if (error instanceof FriendlyError) {
    return error.message;
  }

  if (typeof error === "object" && error && "code" in error) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account already exists for this email.";
      case "auth/invalid-credential":
      case "auth/invalid-email":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Incorrect email or password.";
      case "auth/network-request-failed":
      case "unavailable":
        return "Network unavailable. Check your connection and try again.";
      case "permission-denied":
        return "Permission denied. Check your Firestore security rules.";
    }
  }

  return fallback;
}
