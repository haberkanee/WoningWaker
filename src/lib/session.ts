import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Plan } from "@prisma/client";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/** Vereist een ingelogde gebruiker; anders redirect naar login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Vereist een ingelogde admin. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return u?.plan ?? "GRATIS";
}
