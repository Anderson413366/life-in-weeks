import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/components";

interface AuthGateProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onGoogleSignIn: () => Promise<void>;
  onResetPassword: (email: string) => Promise<void>;
  onUpdatePassword: (password: string) => Promise<void>;
  onExitRecoveryMode: () => void;
  recoveryMode: boolean;
  authMessage?: string;
}

const FIELD_CLASS = "app-field";
const GHOST_BUTTON_CLASS = "text-sm text-white/50 transition-colors hover:text-white";

const PRODUCT_CHIPS = [
  "A private record of your weeks",
  "Low-noise journaling",
  "Export when you need it",
];

function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  showProductChips = false,
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showProductChips?: boolean;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(21,208,255,0.08),transparent_28%),radial-gradient(circle_at_bottom,rgba(241,92,168,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.01),transparent_32%)]" />

      <div className="relative w-full max-w-[30rem]">
        <div className="pointer-events-none absolute inset-x-10 -top-10 h-28 rounded-full bg-primary/15 blur-3xl" />

        <div className="card-base relative overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),transparent_36%,rgba(255,255,255,0.02))]" />

          <div className="relative flex flex-col gap-6">
            <header className="space-y-3 text-center">
              <p className="eyebrow mx-auto justify-center">{eyebrow}</p>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2.1rem]">{title}</h1>
                <div className="mx-auto max-w-md text-sm leading-7 text-white/60">{description}</div>
              </div>
              {showProductChips && (
                <div className="flex flex-wrap justify-center gap-2 pt-1">
                  {PRODUCT_CHIPS.map((chip) => (
                    <span key={chip} className="chip text-[0.68rem] text-white/70">
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {children}

            {footer ? <div className="text-center text-[0.7rem] leading-6 text-white/35">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthField({
  id,
  label,
  ...props
}: {
  id: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="block space-y-2 text-left">
      <span className="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-white/45">{label}</span>
      <input id={id} className={FIELD_CLASS} {...props} />
    </label>
  );
}

function InlineMessage({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "error";
}) {
  const toneClass = tone === "error"
    ? "border-accent/30 bg-accent/10 text-accent"
    : "border-white/10 bg-white/[0.04] text-white/65";

  return (
    <div aria-live="polite" className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      variant="primary"
      size="lg"
      fullWidth
    >
      {children}
    </Button>
  );
}

const AuthGate: React.FC<AuthGateProps> = ({
  onSignIn,
  onSignUp,
  onGoogleSignIn,
  onResetPassword,
  onUpdatePassword,
  onExitRecoveryMode,
  recoveryMode,
  authMessage,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    if (!authMessage) return;
    setError(authMessage);
    setCheckEmail(false);
    setResetSent(false);
    setPasswordUpdated(false);
    setIsForgotPassword(false);
    setIsSignUp(false);
  }, [authMessage]);

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
      <AuthShell
        eyebrow="Account Setup"
        title="Check your inbox"
        description={(
          <>
            We sent a verification link to <strong className="text-white">{email}</strong>. Open it to unlock your timeline and finish setting up your account.
          </>
        )}
      >
        <InlineMessage>
          We will hold your place here. If the message does not appear, check spam or promotions before requesting another link.
        </InlineMessage>

        <button
          type="button"
          onClick={() => { setCheckEmail(false); setIsSignUp(false); }}
          className={`${GHOST_BUTTON_CLASS} w-full`}
        >
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  if (recoveryMode || passwordUpdated) {
    return (
      <AuthShell
        eyebrow="Recovery"
        title={passwordUpdated ? "Password updated" : "Choose a new password"}
        description={passwordUpdated
          ? "Your account is ready. Continue into the app with your new password."
          : "Create a strong password so you can get back into your private timeline without friction next time."}
      >
        {passwordUpdated ? (
          <div className="flex flex-col gap-4">
            <InlineMessage>
              The reset is complete. Continue when you are ready to sign in again.
            </InlineMessage>

            <PrimaryButton
              type="button"
              onClick={() => {
                setPasswordUpdated(false);
                setPassword("");
                setConfirmPassword("");
                setError("");
                onExitRecoveryMode();
              }}
            >
              Continue
            </PrimaryButton>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");

              if (password.length < 8) {
                setError("Use at least 8 characters.");
                return;
              }

              if (password !== confirmPassword) {
                setError("Passwords do not match.");
                return;
              }

              setLoading(true);
              try {
                await onUpdatePassword(password);
                setPasswordUpdated(true);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to update password");
              } finally {
                setLoading(false);
              }
            }}
            className="flex flex-col gap-4"
          >
            <AuthField
              id="new-password"
              label="New Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <AuthField
              id="confirm-password"
              label="Confirm Password"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />

            {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "Saving..." : "Update Password"}
            </PrimaryButton>
          </form>
        )}
      </AuthShell>
    );
  }

  if (resetSent) {
    return (
      <AuthShell
        eyebrow="Reset Link Sent"
        title="Check your email"
        description={(
          <>
            We sent a secure reset link to <strong className="text-white">{email}</strong>. Open it to choose a new password.
          </>
        )}
      >
        <InlineMessage>
          The link can take a moment to arrive. If you do not see it, check spam or retry from the sign-in screen.
        </InlineMessage>

        <button
          type="button"
          onClick={() => { setResetSent(false); setIsForgotPassword(false); }}
          className={`${GHOST_BUTTON_CLASS} w-full`}
        >
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  if (isForgotPassword) {
    return (
      <AuthShell
        eyebrow="Recovery"
        title="Reset your password"
        description="We will email you a secure link so you can get back into your account without losing your reflections."
      >
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
          className="flex flex-col gap-4"
        >
          <AuthField
            id="reset-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </PrimaryButton>
        </form>

        <button
          type="button"
          onClick={() => { setIsForgotPassword(false); setError(""); }}
          className={`${GHOST_BUTTON_CLASS} w-full`}
        >
          Back to sign in
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Private Weekly Reflection"
      title="Life in Weeks"
      description={isSignUp
        ? "Start with your birthdate, then build a calm private record of the weeks that shaped you."
        : "Return to your timeline, your notes, and the weeks you want to remember with clarity."}
      showProductChips
      footer={(
        <>
          By continuing, you agree to our{" "}
          <Link to="/terms" className="text-primary/80 underline-offset-2 transition-colors hover:text-primary hover:underline">
            Terms of Service
          </Link>
          {" "}and{" "}
          <Link to="/privacy" className="text-primary/80 underline-offset-2 transition-colors hover:text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </>
      )}
    >
      <div className="rounded-[1.7rem] border border-white/8 bg-white/[0.02] p-4 sm:p-5">
        <button
          type="button"
          onClick={async () => {
            setError("");
            try {
              await onGoogleSignIn();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Google sign-in failed");
            }
          }}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-medium text-white transition-colors hover:bg-white/[0.07]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[0.68rem] uppercase tracking-[0.18em] text-white/30">Or use email</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthField
            id="auth-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <AuthField
            id="auth-password"
            label="Password"
            type="password"
            placeholder={isSignUp ? "Create a password" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />

          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </PrimaryButton>
        </form>
      </div>

      <div className="flex flex-col items-center gap-2 text-center">
        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
          className={GHOST_BUTTON_CLASS}
        >
          {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
        </button>

        {!isSignUp && (
          <button
            type="button"
            onClick={() => { setIsForgotPassword(true); setError(""); }}
            className="text-sm text-white/35 transition-colors hover:text-primary"
          >
            Forgot your password?
          </button>
        )}
      </div>
    </AuthShell>
  );
};

export default AuthGate;
