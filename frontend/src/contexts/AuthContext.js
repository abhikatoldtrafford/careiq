import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sign up with email/password
  async function signup(email, password, name) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Verify with backend
      await verifyUserWithBackend(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Sign in with email/password
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await verifyUserWithBackend(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Sign in with Google
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await verifyUserWithBackend(result.user);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Sign out
  async function logout() {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  }

  // Verify user with backend
  async function verifyUserWithBackend(firebaseUser) {
    if (!firebaseUser) return;
    
    try {
      const response = await api.post('/api/auth/verify');
      setUserData(response.data);
    } catch (error) {
      console.error('Backend verification error:', error);
      // Use Firebase data as fallback
      setUserData({
        id: firebaseUser.uid,
        firebase_uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        email: firebaseUser.email,
        role: 'staff'
      });
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await verifyUserWithBackend(user);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    signup,
    loginWithGoogle,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}