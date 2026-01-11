import Header from "@/components/Header";
import AIBot from "@/components/AIBot";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      {process.env.NODE_ENV === 'development' && <AIBot />}
    </div>
  );
}
