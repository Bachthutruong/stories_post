
import AuthForm from '@/components/AuthForm';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow container mx-auto px-4 py-12 flex items-center justify-center">
        <AuthForm />
      </main>
      <Footer />
    </div>
  );
}
