import Header from "@/components/Header";
import { redirect } from "next/navigation";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Since dashboard is now the root, we can redirect from here if needed.
  // For now, just render children.
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
