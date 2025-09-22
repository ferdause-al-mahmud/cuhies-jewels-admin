import "./globals.css";
import AuthProvider from "./services/AuthProvider";
import { Toaster } from "react-hot-toast";
import { Assistant } from "next/font/google";

// Load Assistant font
const assistant = Assistant({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});



export const metadata = {
  title: {
    default: "Cuhie's Jewels  - Admin Panel",
    template: "%s | Cuhie's Jewels",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      </head>

      <body
        className={`${assistant.className}`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <main className="">{children}</main>
          <Toaster position="top-right" reverseOrder={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
