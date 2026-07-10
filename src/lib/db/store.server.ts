import { createSeedData } from "./seed.server";
import type {
  AccessCode,
  Contact,
  DeviceBinding,
  QuizAttempt,
  QuizQuestion,
  Tier,
  TrafficSign,
} from "./types";

type DbState = {
  accessCodes: AccessCode[];
  deviceBindings: DeviceBinding[];
  quizAttempts: QuizAttempt[];
  quizQuestions: QuizQuestion[];
  trafficSigns: TrafficSign[];
  contacts: Contact[];
};

const seed = createSeedData();

const db: DbState = {
  accessCodes: structuredClone(seed.accessCodes),
  deviceBindings: [],
  quizAttempts: [],
  quizQuestions: structuredClone(seed.quizQuestions),
  trafficSigns: structuredClone(seed.trafficSigns),
  contacts: structuredClone(seed.contacts),
};

const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();

export function findAccessCodeByCode(code: string) {
  return db.accessCodes.find((c) => c.code === code) ?? null;
}

export function updateAccessCode(id: string, patch: Partial<AccessCode>) {
  const row = db.accessCodes.find((c) => c.id === id);
  if (!row) return null;
  Object.assign(row, patch);
  return row;
}

export function findBindingByCodeId(codeId: string) {
  return db.deviceBindings.find((b) => b.code_id === codeId) ?? null;
}

export function findBindingByCodeIdAndDevice(codeId: string, device: string) {
  return db.deviceBindings.find((b) => b.code_id === codeId && b.device_fingerprint === device) ?? null;
}

export function findBindingByToken(token: string) {
  return db.deviceBindings.find((b) => b.session_token === token) ?? null;
}

export function insertBinding(input: {
  code_id: string;
  device_fingerprint: string;
  session_token: string;
  user_agent?: string | null;
}) {
  const binding: DeviceBinding = {
    id: newId(),
    code_id: input.code_id,
    device_fingerprint: input.device_fingerprint,
    session_token: input.session_token,
    user_agent: input.user_agent ?? null,
    bound_at: now(),
    last_seen_at: now(),
  };
  db.deviceBindings.push(binding);
  return binding;
}

export function updateBindingLastSeen(token: string) {
  const binding = findBindingByToken(token);
  if (!binding) return;
  binding.last_seen_at = now();
}

export function deleteBindingByToken(token: string) {
  const idx = db.deviceBindings.findIndex((b) => b.session_token === token);
  if (idx >= 0) db.deviceBindings.splice(idx, 1);
}

export function deleteBindingByCodeId(codeId: string) {
  const idx = db.deviceBindings.findIndex((b) => b.code_id === codeId);
  if (idx >= 0) db.deviceBindings.splice(idx, 1);
}

export function getAccessCodeForBinding(token: string) {
  const binding = findBindingByToken(token);
  if (!binding) return null;
  const code = db.accessCodes.find((c) => c.id === binding.code_id);
  if (!code) return null;
  return { binding, code };
}

export function getQuizQuestions() {
  return [...db.quizQuestions];
}

export function getQuizQuestionsByIds(ids: number[]) {
  const set = new Set(ids);
  return db.quizQuestions.filter((q) => set.has(q.id));
}

export function insertQuizAttempt(input: Omit<QuizAttempt, "id" | "created_at">) {
  const attempt: QuizAttempt = { ...input, id: newId(), created_at: now() };
  db.quizAttempts.push(attempt);
  return attempt;
}

export function getQuizAttemptsByCodeId(codeId: string, limit = 50) {
  return db.quizAttempts
    .filter((a) => a.code_id === codeId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export function getContacts() {
  return [...db.contacts].sort((a, b) => a.display_order - b.display_order);
}

export function getTrafficSigns() {
  return [...db.trafficSigns].sort((a, b) => a.display_order - b.display_order);
}

export function listAccessCodes(opts: { tier: Tier | "all"; limit: number }) {
  let rows = db.accessCodes.filter((c) => !c.is_admin);
  if (opts.tier !== "all") rows = rows.filter((c) => c.tier === opts.tier);
  rows = rows.sort((a, b) => a.tier.localeCompare(b.tier) || a.code.localeCompare(b.code));
  return rows.slice(0, opts.limit).map((code) => ({
    ...code,
    device_bindings: db.deviceBindings.find((b) => b.code_id === code.id) ?? null,
  }));
}

export function setCodeRevoked(codeId: string, revoke: boolean) {
  return updateAccessCode(codeId, { is_revoked: revoke });
}

export function getAdminStats() {
  const codes = db.accessCodes.filter((c) => !c.is_admin);
  return {
    total: codes.length,
    used: codes.filter((c) => c.first_used_at).length,
    revoked: codes.filter((c) => c.is_revoked).length,
    bound: db.deviceBindings.length,
  };
}

export async function requireAdminSession(token: string, device: string) {
  const session = getAccessCodeForBinding(token);
  if (!session || session.binding.device_fingerprint !== device || !session.code.is_admin) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireSession(token: string, device: string) {
  const session = getAccessCodeForBinding(token);
  if (!session) {
    throw new Error("Unauthorized");
  }
  const { code } = session;
  // Skip device check for admins and lifetime codes
  const isUnlimited = code.is_admin || !code.duration_days;
  if (!isUnlimited && session.binding.device_fingerprint !== device) {
    throw new Error("Unauthorized");
  }
  if (code.is_revoked) throw new Error("Unauthorized");
  if (code.duration_days && code.first_used_at) {
    const expiresAt = new Date(new Date(code.first_used_at).getTime() + code.duration_days * 86400000);
    if (expiresAt < new Date()) throw new Error("Unauthorized");
  }
  return session;
}

export async function resolveCodeId(token: string, device: string) {
  const session = await requireSession(token, device);
  return session.code.id;
}
