"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-ditch-orange rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">SpecOS</h1>
          <p className="text-gray-500 text-sm">Sign in with your Ditch account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl text-center">{error}</div>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-ditch-orange focus:ring-0 focus:outline-none text-sm"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:border-ditch-orange focus:ring-0 focus:outline-none text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ditch-orange text-white font-medium rounded-xl hover:bg-ditch-orange/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-gray-400 text-xs text-center mt-8">Ditch Internal Use Only</p>
      </div>
    </div>
  );
}
