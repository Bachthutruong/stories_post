
import AdminSidebar from '@/components/AdminSidebar';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { AuthProvider, useAuth } from '@/components/providers/AuthProvider'; // Ensure useAuth is available
import AdminAuthGuard from './AdminAuthGuard';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="flex flex-1 pt-16"> {/* pt-16 to offset fixed header height */}
        <AdminAuthGuard>
          <AdminSidebar />
          <main className="flex-grow p-6 md:p-8 ml-0 md:ml-64 bg-background"> {/* ml-64 for sidebar width */}
            {children}
          </main>
        </AdminAuthGuard>
      </div>
      {/* Optional: Footer can be excluded from admin layout or styled differently */}
      {/* <Footer /> */}
    </div>
  );
}

// Component to handle auth guard for admin pages
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = React.useRef<any>(null); // Using React.useRef to avoid Next.js import error in this context

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !router.current) {
      // Dynamically import useRouter only on the client side
      import('next/navigation').then(mod => {
        router.current = mod.useRouter();

        if (!isLoading && (!user || !user.isAdmin)) {
          router.current.push('/auth/login?redirect=/admin/dashboard');
        }
      });
    } else if (router.current && !isLoading && (!user || !user.isAdmin)) {
      router.current.push('/auth/login?redirect=/admin/dashboard');
    }
  }, [user, isLoading]);
  

  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading admin area...</p></div>;
  }

  if (!user || !user.isAdmin) {
    return <div className="flex justify-center items-center h-full"><p>Access Denied. Redirecting to login...</p></div>;
  }

  return <>{children}</>;
}
