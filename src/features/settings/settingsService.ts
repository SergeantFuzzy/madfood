import { Profile } from "../../lib/dbTypes";
import { supabase } from "../../lib/supabaseClient";

export const getProfile = async (): Promise<Profile | null> => {
  const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertProfile = async (payload: { display_name: string | null }): Promise<Profile> => {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email ?? "", display_name: payload.display_name }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};
