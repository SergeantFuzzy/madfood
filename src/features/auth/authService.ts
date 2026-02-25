import env from "../../lib/env";
import { supabase } from "../../lib/supabaseClient";

export const signInWithEmail = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const emailRedirectTo = `${window.location.origin}${env.baseUrl}dashboard`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo }
  });
  if (error) throw error;
};

export const sendPasswordReset = async (email: string) => {
  const redirectTo = `${window.location.origin}${env.baseUrl}update-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
};

export const updatePassword = async (password: string) => {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
