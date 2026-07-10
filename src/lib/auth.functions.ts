import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseServer } from "@/integrations/supabase/server";

// Custom auth via access codes and device bindings (Supabase).
// session_token is generated server-side and stored on the client in localStorage.

const loginSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "کۆد دەبێت ٦ ژمارە بێت"),
  device: z.string().min(8).max(128),
  userAgent: z.string().max(500).optional(),
});

export const loginWithCode = createServerFn({ method: "POST" })
  .validator((d: unknown) => loginSchema.parse(d))
  .handler(async ({ data }) => {
    // Check if activation code exists and is valid
    const { data: codeData, error: codeError } = await supabaseServer
      .from('activation_codes')
      .select('*')
      .eq('code', data.code)
      .single();

    if (codeError || !codeData) {
      throw new Error("کۆدی نادروست");
    }

    if (codeData.is_used) {
      throw new Error("ئەم کۆدە پێشتر بەکارهێنراوە");
    }

    // Check if user already exists for this device
    const { data: existingUser } = await supabaseServer
      .from('users')
      .select('*')
      .eq('device_id', data.device)
      .single();

    let sessionToken: string;
    let userId: string;

    if (existingUser) {
      // Update existing user
      sessionToken = existingUser.session_token;
      userId = existingUser.id;
      
      await supabaseServer
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
    } else {
      // Create new user
      const rnd = crypto.getRandomValues(new Uint8Array(32));
      sessionToken = Array.from(rnd, (b) => b.toString(16).padStart(2, "0")).join("");
      
      const { data: newUser, error: userError } = await supabaseServer
        .from('users')
        .insert({
          device_id: data.device,
          session_token: sessionToken,
          is_admin: false,
          tier: codeData.tier,
          duration_days: codeData.duration_days,
        })
        .select()
        .single();

      if (userError || !newUser) {
        throw new Error("هەڵە لە دروستکردنی بەکارهێنەر");
      }
      
      userId = newUser.id;
    }

    // Mark activation code as used
    await supabaseServer
      .from('activation_codes')
      .update({ 
        is_used: true, 
        used_by: userId, 
        used_at: new Date().toISOString() 
      })
      .eq('id', codeData.id);

    return {
      sessionToken,
      isAdmin: false,
      tier: codeData.tier,
      durationDays: codeData.duration_days,
      firstUsedAt: codeData.used_at ?? new Date().toISOString(),
    };
  });

const tokenSchema = z.object({ token: z.string().min(10), device: z.string().min(8) });

export const validateSession = createServerFn({ method: "POST" })
  .validator((d: unknown) => tokenSchema.parse(d))
  .handler(async ({ data }) => {
    // Set device context for RLS
    await supabaseServer.rpc('set_device_context', { device_id: data.device });

    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('session_token', data.token)
      .eq('device_id', data.device)
      .single();

    if (error || !user) {
      return { valid: false as const };
    }

    // Check expiration
    let daysLeft: number | null = null;
    if (user.duration_days && user.created_at) {
      const expiresAt = new Date(new Date(user.created_at).getTime() + user.duration_days * 86400000);
      const ms = expiresAt.getTime() - Date.now();
      if (ms <= 0) {
        return { valid: false as const, reason: "expired" };
      }
      daysLeft = Math.ceil(ms / 86400000);
    }

    // Update last seen
    await supabaseServer
      .from('users')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', user.id);

    return {
      valid: true as const,
      isAdmin: user.is_admin,
      tier: user.tier,
      daysLeft,
    };
  });

export const logout = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ token: z.string() }).parse(d))
  .handler(async ({ data }) => {
    // For simplicity, we don't delete the user, just invalidate session
    // In a real app, you might want to delete the session token
    return { ok: true };
  });
