
import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { auth } from "./firebase";
import { createUserProfile, getUserProfile } from "./services/firestoreService";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import ToastBanner from "./components/ToastBanner";
import "./App.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const DatabasePage = lazy(() => import("./pages/DatabasePage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));

function AppContent() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [theme, setTheme] = useState("light");
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const preferDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("medverify-theme") || (preferDark ? "dark" : "light");
    setTheme(storedTheme);
    document.body.dataset.theme = storedTheme;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const profileData = await getUserProfile(currentUser.uid);
          setProfile(profileData || null);
        } catch (profileError) {
          console.error("Unable to load user profile", profileError);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const mapAuthError = (code) => {
    switch (code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
        return "No account exists for this email yet.";
      case "auth/wrong-password":
        return "The password you entered is incorrect.";
      case "auth/invalid-credential":
        return "The email or password you entered is incorrect.";
      case "auth/email-already-in-use":
        return "This email address is already registered.";
      case "auth/weak-password":
        return "Please choose a stronger password with at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again shortly.";
      default:
        return "We could not complete that request. Please try again.";
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.body.dataset.theme = nextTheme;
    localStorage.setItem("medverify-theme", nextTheme);
  };

  const handleLogin = async ({ email, password }) => {
    setAuthLoading(true);
    clearMessages();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setToast({ type: "success", message: "Welcome back to MedVerify." });
      navigate("/dashboard");
    } catch (loginError) {
      setError(mapAuthError(loginError.code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async ({ name, email, password }) => {
    setAuthLoading(true);
    clearMessages();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(userCredential.user.uid, {
        name,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      });
      setProfile({ name, email, role: "user", createdAt: "just now" });
      setSuccessMessage("Account created successfully.");
      setToast({ type: "success", message: "Your MedVerify account is ready." });
      navigate("/dashboard");
    } catch (signupError) {
      setError(signupError.message || mapAuthError(signupError.code));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    clearMessages();

    try {
      const provider = new GoogleAuthProvider();
      let userCredential;

      try {
        userCredential = await signInWithPopup(auth, provider);
      } catch (popupError) {
        // fallback to redirect if popup blocked or not supported
        try {
          await signInWithRedirect(auth, provider);
          return; // redirect will continue flow
        } catch (redirectError) {
          throw redirectError;
        }
      }

      const firebaseUser = userCredential.user;
      if (firebaseUser) {
        const existingProfile = await getUserProfile(firebaseUser.uid);
        if (!existingProfile) {
          await createUserProfile(firebaseUser.uid, {
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            role: "user",
            createdAt: serverTimestamp(),
          });
        }
        setToast({ type: "success", message: "Signed in with Google." });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Google sign-in error", error);
      setError("We could not sign in with Google right now.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    clearMessages();

    try {
      await signOut(auth);
      setProfile(null);
      setToast({ type: "info", message: "You have been logged out." });
      navigate("/login");
    } catch (logoutError) {
      setError("We could not sign you out right now.");
    } finally {
      setAuthLoading(false);
    }
  };

  const refreshProfile = async (nextProfile) => {
    if (nextProfile) {
      setProfile(nextProfile);
    } else if (user) {
      const profileData = await getUserProfile(user.uid);
      setProfile(profileData || null);
    }
  };

  return (
    <>
      <ToastBanner toast={toast} />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage
                onLogin={handleLogin}
                loading={authLoading}
                error={error}
                successMessage={successMessage}
                onSwitchToSignup={() => {
                  clearMessages();
                  navigate("/signup");
                }}
                onGoogleLogin={handleGoogleSignIn}
              />
            )
          }
        />
        <Route
          path="/signup"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage
                onSignup={handleSignup}
                loading={authLoading}
                error={error}
                onSwitchToLogin={() => {
                  clearMessages();
                  navigate("/login");
                }}
              />
            )
          }
        />
        <Route
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AppLayout user={user} profile={profile} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<div className="loading-card">Loading dashboard…</div>}>
                <ErrorBoundary>
                  <DashboardPage user={user} profile={profile} onLogout={handleLogout} loading={authLoading} />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/scan"
            element={
              <Suspense fallback={<div className="loading-card">Loading scanner…</div>}>
                <ErrorBoundary>
                  <ScanPage user={user} profile={profile} />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/database"
            element={
              <Suspense fallback={<div className="loading-card">Loading database…</div>}>
                <ErrorBoundary>
                  <DatabasePage profile={profile} />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/history"
            element={
              <Suspense fallback={<div className="loading-card">Loading history…</div>}>
                <ErrorBoundary>
                  <HistoryPage user={user} />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<div className="loading-card">Loading profile…</div>}>
                <ErrorBoundary>
                  <ProfilePage user={user} profile={profile} refreshProfile={refreshProfile} />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<div className="loading-card">Loading settings…</div>}>
                <ErrorBoundary>
                  <SettingsPage theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
                </ErrorBoundary>
              </Suspense>
            }
          />
          <Route
            path="/report"
            element={
              <Suspense fallback={<div className="loading-card">Loading report…</div>}>
                <ErrorBoundary>
                  <ReportPage user={user} />
                </ErrorBoundary>
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

