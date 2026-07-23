import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleSignIn, OfScheiding } from "@/components/google-signin";
import { googleEnabled } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Inloggen" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Inloggen</CardTitle>
      </CardHeader>
      <CardContent>
        {googleEnabled && (
          <>
            <GoogleSignIn label="Inloggen met Google" />
            <OfScheiding />
          </>
        )}
        <LoginForm />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Nog geen account?{" "}
          <Link href="/registreren" className="font-medium text-primary hover:underline">
            Registreren
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
