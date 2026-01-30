import { useRef, useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { PageTransition } from "../components/ui/PageTransition";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLoading } from "../components/ui/loading";
import { API_BASE_URL } from "../utils/config";
import { ShieldCheck, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, setLoading } = useLoading();
  const [show, setShow] = useState(true);
  const [step, setStep] = useState(1);

  // Form State
  const [email, setEmail] = useState(location.state?.email?.toLowerCase() || "");
  const [codeChars, setCodeChars] = useState<string[]>(Array(8).fill(""));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error State
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    if (shouldShake) {
      const timer = setTimeout(() => setShouldShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shouldShake]);

  const validateStep1 = () => {
    setEmailError(null);
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    // Simple email regex for basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Invalid email address");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    setCodeError(null);
    const joined = codeChars.join("");
    if (!/^[A-Za-z0-9]{8}$/.test(joined)) {
      setCodeError("Enter all 8 characters");
      setShouldShake(true);
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    setPasswordError(null);
    setConfirmError(null);
    let valid = true;

    if (!password.trim()) {
      setPasswordError("Password is required");
      valid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      valid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmError("Confirm your password");
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      valid = false;
    }

    return valid;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!pastedData) return;

    const next = [...codeChars];
    pastedData.split('').slice(0, 8).forEach((char, index) => {
      next[index] = char;
    });
    setCodeChars(next);
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 7);
    inputsRef.current[nextIndex]?.focus();
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (step === 1) {
      if (!validateStep1()) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/otp/forgot-password/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to send OTP");
        }

        // Success: move to next step
        setStep(2);
      } catch (err: any) {
        setServerError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!validateStep2()) return;

      setLoading(true);
      try {
        const otp = codeChars.join("");
        const res = await fetch(`${API_BASE_URL}/otp/forgot-password/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });

        if (!res.ok) {
          const errText = await res.text();
          let message = "Invalid OTP";
          try {
            const json = JSON.parse(errText);
            message = json.detail || message;
          } catch {
            message = errText || message;
          }
          throw new Error(message);
        }

        toast.success("OTP verified successfully!");
        setStep(3);
      } catch (err: any) {
        setCodeError(err.message);
        setShouldShake(true);
      } finally {
        setLoading(false);
      }
    }
  };

  function getRoleFromToken(token: string | null): string | null {
    if (!token) return null;
  
    const parts = token.split(".");
    if (parts.length < 2) return null;
  
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(base64);
      const payload = JSON.parse(json);
  
      return (
        payload.role ||
        payload.user_role ||
        (Array.isArray(payload.roles) ? payload.roles[0] : null) ||
        null
      );
    } catch {
      return null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!validateStep3()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/otp/forgot-password/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          new_password: password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("token", data.access_token);
        }
        setSuccessMessage("Your password has been reset. You can now log in.");
        
        const role = getRoleFromToken(data.access_token);
        if (role === "Graduate") {
          navigate("/student");
        } else if (role === "Admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
        return;
      }

      const errText = await res.text();
      let message = "Failed to reset password";
      try {
        const json = JSON.parse(errText);
        message = json.detail || message;
      } catch {
        message = errText || message;
      }
      setServerError(message);

    } catch (err: any) {
      setServerError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <PageTransition className="min-h-screen bg-gradient-to-br from-[var(--admin-login-from)] to-[var(--student-login-to)] flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setShow(false);
                window.setTimeout(() => navigate("/"), 300);
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Home</span>
            </Link>

            <div className="bg-card rounded-3xl shadow-xl shadow-black/5 dark:shadow-black/20 p-8 min-h-[400px] flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-foreground mb-2">Reset Password</h1>
                <p className="text-muted-foreground text-sm">
                  {step === 1 && "Step 1: Enter your email to reset password"}
                  {step === 2 && "Step 2: Enter the code sent to your email"}
                  {step === 3 && "Step 3: Set a new password"}
                </p>
              </div>

              <form onSubmit={step === 3 ? handleSubmit : handleNext} noValidate>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={!!emailError}
                          required
                          autoFocus
                          className="rounded-xl"
                        />
                        {emailError && (
                          <p className="text-sm text-red-600">{emailError}</p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
                      >
                        Continue
                      </Button>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="activationCode">Verification Code</Label>
                        <motion.div
                          id="activationCode"
                          className="flex items-center justify-center gap-1 sm:gap-2"
                          animate={shouldShake ? { x: [-10, 10, -10, 10, 0] } : {}}
                          transition={{ duration: 0.4 }}
                        >
                          {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="flex items-center">
                              <Input
                                ref={(el) => {
                                  inputsRef.current[idx] = el;
                                }}
                                type="text"
                                inputMode="text"
                                maxLength={1}
                                value={codeChars[idx]}
                                onPaste={handlePaste}
                                onChange={(e) => {
                                  const v = e.target.value
                                    .replace(/[^A-Za-z0-9]/g, "")
                                    .toUpperCase();
                                  const next = [...codeChars];
                                  next[idx] = v.slice(0, 1);
                                  setCodeChars(next);
                                  if (v && idx < 7) {
                                    inputsRef.current[idx + 1]?.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Backspace") {
                                    if (codeChars[idx]) {
                                      const next = [...codeChars];
                                      next[idx] = "";
                                      setCodeChars(next);
                                    } else if (idx > 0) {
                                      inputsRef.current[idx - 1]?.focus();
                                      const next = [...codeChars];
                                      next[idx - 1] = "";
                                      setCodeChars(next);
                                    }
                                  }
                                  if (e.key === "ArrowLeft" && idx > 0) {
                                    inputsRef.current[idx - 1]?.focus();
                                  }
                                  if (e.key === "ArrowRight" && idx < 7) {
                                    inputsRef.current[idx + 1]?.focus();
                                  }
                                }}
                                aria-invalid={!!codeError}
                                autoFocus={idx === 0}
                                className="rounded-lg w-8 h-8 sm:w-10 sm:h-10 text-center font-mono uppercase text-base sm:text-lg p-0"
                              />
                              {idx === 3 && (
                                <span className="mx-1 sm:mx-2 text-muted-foreground">
                                  -
                                </span>
                              )}
                            </div>
                          ))}
                        </motion.div>
                        {codeError && (
                          <p className="text-sm text-red-600 text-center">
                            {codeError}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
                      >
                        Continue
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          className="text-sm text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setStep(1); // Go back to resend
                          }}
                        >
                          Change Email / Resend Code
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      variants={stepVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-invalid={!!passwordError}
                          required
                          autoFocus
                          className="rounded-xl"
                        />
                        {passwordError && (
                          <p className="text-sm text-red-600">{passwordError}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          aria-invalid={!!confirmError}
                          required
                          className="rounded-xl"
                        />
                        {confirmError && (
                          <p className="text-sm text-red-600">{confirmError}</p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {serverError && (
                  <p className="text-sm text-red-600 mt-4 text-center">
                    {serverError}
                  </p>
                )}
                {successMessage && (
                  <p className="text-sm text-green-600 mt-4 text-center">
                    {successMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </PageTransition>
      )}
    </AnimatePresence>
  );
}
