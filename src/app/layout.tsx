import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WoningWaker — jouw sociale-huurassistent",
    template: "%s · WoningWaker",
  },
  description:
    "WoningWaker vindt sociale huurwoningen uit meerdere Nederlandse regio's en platforms, controleert of ze bij je passen en bewaakt je hele huurproces.",
  applicationName: "WoningWaker",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "WoningWaker", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="min-h-screen">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
