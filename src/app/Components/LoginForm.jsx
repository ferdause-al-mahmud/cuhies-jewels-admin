"use client";
import { useState, Suspense, useEffect } from "react";
import {
  useAuthState,
  useSignInWithEmailAndPassword,
  useSignInWithGoogle,
  useSignOut,
} from "react-firebase-hooks/auth";
import { getIdToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import CircularProgress from "@mui/material/CircularProgress";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { auth } from "../firebase/firebase.config";
import { FaEye, FaEyeSlash, FaShieldAlt } from "react-icons/fa";
import { MdAdminPanelSettings } from "react-icons/md";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [eye, setEye] = useState(false);
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [signInWithGoogle, , googleLoading, googleError] =
    useSignInWithGoogle(auth);
  const [existingUser, existingUserloading] = useAuthState(auth);
  useEffect(() => {
    if (existingUser) {
      router.push("/dashboard");
    }
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  const handleShowPass = () => setEye(!eye);

  const [emailLoading, setEmailLoading] = useState(false);
  const [signOut] = useSignOut(auth);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      const result = await signInWithEmailAndPassword(email, password);
      if (result?.user) {
        if (!result.user.emailVerified) {
          toast.error("Please verify your email before logging in.");
          setEmailLoading(false);
          const success = await signOut();
          return;
        }
        const token = await getIdToken(result.user);
        localStorage.setItem("firebase_token", token);
        router.push(returnUrl);
        toast.success("Login successful");
      }
      setEmailLoading(false);
    } catch (err) {
      toast.error("Login failed: " + err.message);
      setEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        const token = await getIdToken(result.user);
        const googleEmail = result.user.email;

        localStorage.setItem("firebase_token", token);

        // Check and store user in DB
        const response = await fetch(`/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: googleEmail,
            name: result.user.displayName || "Google User",
            isVerified: true,
          }),
        });

        if (response.ok || response.status === 409) {
          // Either user is created or already exists
          router.push(returnUrl);

          toast.success("Google login successful");
        }
      }
    } catch (err) {
      toast.error("Google login failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}

      <div className="relative w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <MdAdminPanelSettings className="text-3xl text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400">Sign in to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleEmailLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200 block">
                Email Address
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200 block">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 pr-12"
                  onChange={(e) => setPassword(e.target.value)}
                  type={eye ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  required
                />
                <button
                  type="button"
                  onClick={handleShowPass}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors duration-200"
                >
                  {eye ? (
                    <FaEyeSlash className="text-lg" />
                  ) : (
                    <FaEye className="text-lg" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm py-3 px-4 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-red-400" />
                  {error.message}
                </div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading || emailLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading || emailLoading ? (
                <>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <FaShieldAlt />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center py-4">
              <div className="w-full h-px bg-white/20"></div>
              <div className="absolute bg-slate-800 px-4">
                <span className="text-sm text-slate-400">Or continue with</span>
              </div>
            </div>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              {googleLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <FcGoogle className="text-2xl" />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <FaShieldAlt className="text-green-400" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <CircularProgress sx={{ color: "white" }} />
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
