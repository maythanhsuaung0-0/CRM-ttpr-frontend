import React from "react";
import { Header } from "./header";
import { AppSidebar } from "./sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function Layout({ children,user}) {
  return (
    <SidebarProvider >

      <AppSidebar role={user?.role} />
      <main className="min-w-0 flex-1 bg-slate-50/70">
        <Header CloseSidebar={<SidebarTrigger />} currentUser={user} hideSearchbar />
        {/* <SidebarTrigger /> */}
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </SidebarProvider>
  );
}

export default Layout
