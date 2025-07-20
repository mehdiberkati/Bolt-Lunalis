import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// === Configuration Supabase ===
// Remplacez les valeurs ci-dessous par l'URL et la clé API publique de votre projet.
// Ces informations se trouvent dans la section "API" de votre tableau de bord Supabase.
export const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'; // <--- Collez ici l'URL de votre projet
export const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // <--- Collez ici la clé publique (anon key)

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Récupère les données sauvegardées pour l'utilisateur
export async function fetchUserData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Supabase fetch error:', error);
    return null;
  }
  return data ? data.data : null;
}

// Sauvegarde (upsert) les données de l'utilisateur
export async function saveUserData(userId, data) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ id: userId, data });
  if (error) {
    console.error('Supabase save error:', error);
  }
}
