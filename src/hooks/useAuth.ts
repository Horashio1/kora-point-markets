import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Initialize user stats when user signs in
        if (event === "SIGNED_IN" && session?.user) {
          setTimeout(() => {
            initializeUserResources(session.user);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        setTimeout(() => {
          initializeUserResources(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeUserResources = async (currentUser: User) => {
    await Promise.all([
      initializeUserStats(currentUser.id),
      initializeUserProfile(currentUser),
    ]);
  };

  const initializeUserStats = async (userId: string) => {
    const { data: existingStats } = await supabase
      .from("user_stats")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingStats) {
      await supabase.from("user_stats").insert({
        user_id: userId,
        total_points: 1000,
        daily_allowance: 100,
        points_spent_today: 0,
        wins: 0,
        losses: 0,
      });
    }
  };

  const initializeUserProfile = async (currentUser: User) => {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (!existingProfile) {
      const displayName =
        currentUser.user_metadata?.full_name ||
        currentUser.user_metadata?.name ||
        currentUser.email ||
        null;

      await supabase.from("profiles").insert({
        user_id: currentUser.id,
        display_name: displayName,
        role: "user",
      });
    }
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
