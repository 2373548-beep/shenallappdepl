import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseServer } from "@/integrations/supabase/server";

async function requireAdminSession(token: string, device: string) {
  const { data: user, error } = await supabaseServer
    .from('users')
    .select('*')
    .eq('session_token', token)
    .eq('device_id', device)
    .eq('is_admin', true)
    .single();

  if (error || !user) {
    throw new Error("Forbidden");
  }
  return user;
}

export const listCodes = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({
      token: z.string(),
      device: z.string(),
      tier: z.enum(["15_days", "1_month", "lifetime", "all"]).default("all"),
      status: z.enum(["all", "unused", "active", "expired", "bound"]).default("all"),
      limit: z.number().int().min(1).max(500).default(100),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdminSession(data.token, data.device);

    let query = supabaseServer
      .from('activation_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(data.limit);

    if (data.tier !== "all") {
      query = query.eq('tier', data.tier);
    }

    if (data.status === "unused") {
      query = query.eq('is_used', false);
    } else if (data.status === "active") {
      query = query.eq('is_used', true);
    }

    const { data: codes, error } = await query;

    if (error) {
      throw new Error("Failed to fetch codes");
    }

    return codes || [];
  });

export const resetBinding = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ token: z.string(), device: z.string(), codeId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdminSession(data.token, data.device);

    // Reset activation code to unused
    const { error } = await supabaseServer
      .from('activation_codes')
      .update({ 
        is_used: false, 
        used_by: null, 
        used_at: null 
      })
      .eq('id', data.codeId);

    if (error) {
      throw new Error("Failed to reset binding");
    }

    return { ok: true };
  });

export const revokeCode = createServerFn({ method: "POST" })
  .validator((d: unknown) =>
    z.object({ token: z.string(), device: z.string(), codeId: z.string().uuid(), revoke: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    await requireAdminSession(data.token, data.device);

    // For Supabase, we can mark as used/unused instead of revoked
    const { error } = await supabaseServer
      .from('activation_codes')
      .update({ is_used: data.revoke })
      .eq('id', data.codeId);

    if (error) {
      throw new Error("Failed to update code");
    }

    return { ok: true };
  });

export const adminStats = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string(), device: z.string() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdminSession(data.token, data.device);

    const [{ data: codes }, { data: users }] = await Promise.all([
      supabaseServer.from('activation_codes').select('*'),
      supabaseServer.from('users').select('*'),
    ]);

    const totalCodes = codes?.length || 0;
    const usedCodes = codes?.filter(c => c.is_used).length || 0;
    const totalUsers = users?.length || 0;

    return {
      total: totalCodes,
      used: usedCodes,
      revoked: 0, // Not implemented in Supabase version
      bound: totalUsers,
    };
  });
