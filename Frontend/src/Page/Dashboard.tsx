import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/myne/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "../components/ui/sidebar";
import { Heart } from "lucide-react";

// export default function Dashboard({ children }: { children: React.ReactNode }) {
export default function Dashboard() {
  return (
    <SidebarProvider className="flex border border-black">
      <AppSidebar />
      <main className="flex flex-col w-full flex-grow bg-sky-50">
        <header className="w-full flex justify-between ml-[-2px]">
            <SidebarTrigger />
            <div className="flex justify-between items-center pr-1 gap-2 w-20">
                <div className="flex w-4 h-4 ">
                    <img src="/LogoWitness.png" alt="image" className="object-contain scale-600"  />
                </div>
                <Heart />
            </div>
        </header>
        <Outlet />
      </main>
    </SidebarProvider>
  )
}