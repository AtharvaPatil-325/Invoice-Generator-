import { supabase } from '@/lib/supabase'
import type { Client } from '@/types'

export async function getClients(userId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Client[]
}

export async function getClient(userId: string, clientId: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .eq('id', clientId)
    .single()
  if (error) throw new Error(error.message)
  return data as Client
}

export async function createClient(userId: string, client: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('clients')
    .insert({ user_id: userId, ...client })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Client
}

export async function updateClient(userId: string, clientId: string, updates: Partial<Client>) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', clientId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Client
}

export async function deleteClient(userId: string, clientId: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('user_id', userId)
    .eq('id', clientId)
  if (error) throw new Error(error.message)
}

export async function searchClients(userId: string, query: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .or(`name.ilike.%${query}%,company_name.ilike.%${query}%,email.ilike.%${query}%`)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Client[]
}
