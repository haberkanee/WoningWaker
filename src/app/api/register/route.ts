import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "onbekend";
  const rl = await rateLimit(`register:${ip}`, 5, 3600);
  if (!rl.success) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het later opnieuw." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ongeldige gegevens." },
      { status: 400 },
    );
  }
  const { name, email, password } = parsed.data;
  const normEmail = email.toLowerCase();

  const bestaat = await prisma.user.findUnique({ where: { email: normEmail } });
  if (bestaat) {
    return NextResponse.json({ error: "Er bestaat al een account met dit e-mailadres." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const isAdmin = normEmail === process.env.ADMIN_EMAIL?.toLowerCase();

  const user = await prisma.user.create({
    data: {
      name,
      email: normEmail,
      passwordHash,
      role: isAdmin ? "ADMIN" : "USER",
      profile: { create: {} },
      subscription: { create: { plan: "GRATIS", status: "ACTIVE" } },
      documents: {
        create: [
          { type: "INKOMENSVERKLARING" },
          { type: "LOONSTROOK" },
          { type: "JAAROPGAVE" },
          { type: "BRP_UITTREKSEL" },
          { type: "VERHUURDERSVERKLARING" },
          { type: "IDENTITEITSBEWIJS" },
        ],
      },
    },
  });

  await audit({ userId: user.id, actie: "register", entiteit: "User", entiteitId: user.id, ip });

  return NextResponse.json({ ok: true });
}
