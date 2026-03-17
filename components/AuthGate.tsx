import React, { useState } from "react";
import { motion } from "framer-motion";

interface AuthGateProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
}

const AuthGate: React.FC<AuthGateProps> = ({ onSignIn, onSignUp, onGoogleSignIn, onResetPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await onSignUp(email, password);
        setCheckEmail(true);
      } else {
        await onSignIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="w-full max-w-sm card-base p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            We sent a verification link to <strong className="text-[#00d4ff]">{email}</strong>. Click the link to activate your account.
          </p>
          <p className="text-white/30 text-xs">Didn't get it? Check your spam folder.</p>
          <button
            onClick={() => { setCheckEmail(false); setIsSignUp(false); }}
            className="mt-6 text-sm text-[#00d4ff] hover:underline"
          >
            ← Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  if (resetSent) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="w-full max-w-sm card-base p-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-5xl mb-4">🔑</div>
          <h2 className="text-xl font-bold text-white mb-2">Reset Link Sent</h2>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            We sent a password reset link to <strong className="text-[#00d4ff]">{email}</strong>. Click the link in your email to set a new password.
          </p>
          <p className="text-white/30 text-xs">Didn't get it? Check your spam folder.</p>
          <button
            onClick={() => { setResetSent(false); setIsForgotPassword(false); }}
            className="mt-6 text-sm text-[#00d4ff] hover:underline"
          >
            ← Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <motion.div
          className="w-full max-w-sm card-base p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-[#00d4ff] text-center mb-1 uppercase tracking-wider">
            Life in Weeks
          </h1>
          <p className="text-sm text-white/50 text-center mb-6">
            Reset your password
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setLoading(true);
              try {
                await onResetPassword(email);
                setResetSent(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to send reset email");
              } finally {
                setLoading(false);
              }
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl border border-[rgba(120,80,200,0.15)] bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/40 transition-colors"
            />
            {error && <p className="text-[#ec4899] text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #00d4ff, #ec4899)", color: "white" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
          <button
            onClick={() => { setIsForgotPassword(false); setError(""); }}
            className="mt-4 text-sm text-white/40 hover:text-[#00d4ff] transition-colors w-full text-center"
          >
            ← Back to sign in
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        className="w-full max-w-sm card-base p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-[#00d4ff] text-center mb-1 uppercase tracking-wider">
          Life in Weeks
        </h1>
        <p className="text-sm text-white/50 text-center mb-6">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </p>

        {/* Google sign-in */}
        <button
          onClick={async () => { setError(""); try { await onGoogleSignIn(); } catch (err) { setError(err instanceof Error ? err.message : "Google sign-in failed"); } }}
          className="w-full h-11 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all mb-4"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "white",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 rounded-xl border border-[rgba(120,80,200,0.15)] bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/40 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-11 rounded-xl border border-[rgba(120,80,200,0.15)] bg-transparent px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/40 transition-colors"
          />

          {error && <p className="text-[#ec4899] text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #00d4ff, #ec4899)", color: "white" }}
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className="mt-4 text-sm text-white/40 hover:text-[#00d4ff] transition-colors w-full text-center"
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>

        {!isSignUp && (
          <button
            onClick={() => { setIsForgotPassword(true); setError(""); }}
            className="mt-2 text-sm text-white/30 hover:text-[#ec4899] transition-colors w-full text-center"
          >
            Forgot your password?
          </button>
        )}

        <p className="text-[0.55rem] text-white/20 text-center mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default AuthGate;
