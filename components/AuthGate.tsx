import React, { useState } from "react";
import { motion } from "framer-motion";

interface AuthGateProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

const AuthGate: React.FC<AuthGateProps> = ({ onSignIn, onSignUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await onSignUp(email, password);
      } else {
        await onSignIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        className="w-full max-w-sm bg-card-bg border border-box-border rounded-lg p-6 sm:p-8 shadow-2xl backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-primary text-center mb-1 uppercase tracking-wider drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]">
          Life in Weeks
        </h1>
        <p className="text-sm text-text-muted text-center mb-6">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 rounded-md border border-box-border bg-transparent px-3 text-sm text-white
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-10 rounded-md border border-box-border bg-transparent px-3 text-sm text-white
                       focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />

          {error && <p className="text-accent text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-md bg-primary hover:bg-primary-dark text-bg-dark font-semibold text-sm
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="mt-4 text-sm text-text-muted hover:text-primary transition-colors w-full text-center"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>
      </motion.div>
    </div>
  );
};

export default AuthGate;
