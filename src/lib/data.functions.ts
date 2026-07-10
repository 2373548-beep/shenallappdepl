import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getContacts,
  getQuizQuestions,
  getTrafficSigns,
} from "@/lib/db/store.server";
import { validateSession } from "@/lib/auth.functions";

const sessionSchema = z.object({ token: z.string().min(10), device: z.string().min(8) });

export const getContactsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data }) => {
    const session = await validateSession({ data });
    if (!session.valid) throw new Error("Unauthorized");
    return getContacts();
  });

export const getQuizQuestionsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data }) => {
    const session = await validateSession({ data });
    if (!session.valid) throw new Error("Unauthorized");
    return getQuizQuestions().map(({ correct_option: _c, ...q }) => q);
  });

export const getTrafficSignsFn = createServerFn({ method: "POST" })
  .validator((d: unknown) => sessionSchema.parse(d))
  .handler(async ({ data }) => {
    const session = await validateSession({ data });
    if (!session.valid) throw new Error("Unauthorized");
    return getTrafficSigns();
  });

export { getContactsFn as getContacts, getQuizQuestionsFn as getQuizQuestions };
