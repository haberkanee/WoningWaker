import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignIn, OfScheiding } from "@/components/google-signin";
import { googleEnabled } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registreren" };
export const dynamic = "force-dynamic";

export default function RegistrerenPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Gratis account maken</CardTitle>
      </CardHeader>
      <CardContent>
        {googleEnabled && (
          <>
            <GoogleSignIn label="Registreren met Google" callbackUrl="/profiel?welkom=1" />
            <OfScheiding />
          </>
        )}
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Al een account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inloggen
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Door te registreren ga je akkoord met onze{" "}
          <Link href="/voorwaarden" className="underline">voorwaarden</Link> en{" "}
          <Link href="/privacy" className="underline">privacyverklaring</Link>.
        </p>
      </CardContent>
    </Card>
  );
}
