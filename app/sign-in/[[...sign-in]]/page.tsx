import { SignIn } from "@clerk/nextjs";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 py-12">
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </main>
      <Footer />
    </div>
  );
}

