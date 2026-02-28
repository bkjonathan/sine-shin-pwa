import React, { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Lock, LogIn, Mail, UserPlus } from "lucide-react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "signin" | "signup";

export const LoginPage = () => {
  const { session } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice(null);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) {
          throw error;
        }

        setNotice({
          type: "success",
          message: "Account created. Check your email to confirm your address.",
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Authentication failed. Please try again.";

      setNotice({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const isSignIn = mode === "signin";

  return (
    <div className="liquid-page flex min-h-screen items-center justify-center p-4">
      <div className="liquid-orb left-[-100px] top-[-80px] size-72 bg-sky-400/35" />
      <div className="liquid-orb liquid-orb-drift right-[-90px] bottom-[-60px] size-[22rem] bg-blue-300/30" />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="glass-panel-strong border-white/60 py-0 overflow-hidden">
          <CardHeader className="space-y-4 pb-0 pt-8 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/65 bg-gradient-to-br from-sky-500/95 via-cyan-500/85 to-blue-600/90 text-white shadow-[0_18px_36px_-18px_rgba(14,116,144,0.9)]">
              <Layers className="size-7" />
            </div>
            <div>
              <CardTitle className="text-2xl">Liquid Control Deck</CardTitle>
              <CardDescription className="mt-1">
                Secure access for live manufacturing operations.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-8">
            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as AuthMode);
                setNotice(null);
              }}
            >
              <TabsList className="w-full border border-white/60 bg-white/55">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleAuth} className="space-y-4">
              {notice && (
                <Alert
                  variant={notice.type === "error" ? "destructive" : "default"}
                  className={
                    notice.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-destructive/30 bg-destructive/10"
                  }
                >
                  <AlertDescription
                    className={
                      notice.type === "success" ? "text-emerald-700" : undefined
                    }
                  >
                    {notice.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    className="pl-9"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete={isSignIn ? "current-password" : "new-password"}
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Processing..."
                ) : isSignIn ? (
                  <>
                    <LogIn className="size-4" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Create Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
