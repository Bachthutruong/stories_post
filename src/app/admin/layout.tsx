"use client"; // Ensure this is a Client Component for hooks

import React from 'react'; // Import React
import AdminSidebar from '@/components/AdminSidebar';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation'; // Correct import for useRouter
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button"; // Import Button if not already imported
import { MenuIcon } from "lucide-react"; // Import MenuIcon

// Component to handle auth guard for admin pages
function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter(); // Correctly use useRouter

  React.useEffect(() => {
    if (!isLoading) {
      if (!user || user?.user?.role !== 'admin') {
        console.log("AdminAuthGuard: User not admin or not logged in, redirecting.");
        router.push('/auth/login?redirect=/admin/dashboard');
      }
    }
  }, [user, isLoading, router]);


  if (isLoading) {
    return (
      <div className="flex flex-1 justify-center items-center h-full p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user || user?.user?.role !== 'admin') {
    // This state should be brief due to the useEffect redirect
    return (
      <div className="flex flex-1 justify-center items-center h-full p-8">
        <p className="text-xl text-destructive">Truy cập bị từ chối. Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  return <>{children}</>;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <SiteHeader /> */}
      <div className="flex flex-1"> {/* pt-16 to offset fixed header height */}
        <AdminAuthGuard>
          {/* Mobile sidebar with Sheet */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden fixed top-4 left-4 z-50">
              <Button variant="outline" size="icon">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar />
            </SheetContent>
            {/* Desktop sidebar */}
            <div className="hidden md:block">
              <AdminSidebar />
            </div>
            <main className="flex-grow p-6 md:p-8 ml-0 md:ml-64 bg-background"> {/* ml-64 for sidebar width on desktop */}
              {children}
            </main>
          </Sheet>
        </AdminAuthGuard>
      </div>
      {/* Optional: Footer can be excluded from admin layout or styled differently */}
      {/* <Footer /> */}
    </div>
  );
}
