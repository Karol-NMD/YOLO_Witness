// import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem } from "../ui/sidebar";

// export function AppSidebar() {
//   return (
//     <Sidebar className="bg-blue-700 *:bg-transparent poppins-bold text-xl text-white">
//       <SidebarHeader />
//       import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

// import {
//   Sidebar,
//   SidebarContent,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
// } from "@/components/ui/sidebar"

// // Menu items.
// const items = [
//   {
//     title: "Home",
//     url: "#",
//     icon: Home,
//   },
//   {
//     title: "Inbox",
//     url: "#",
//     icon: Inbox,
//   },
//   {
//     title: "Calendar",
//     url: "#",
//     icon: Calendar,
//   },
//   {
//     title: "Search",
//     url: "#",
//     icon: Search,
//   },
//   {
//     title: "Settings",
//     url: "#",
//     icon: Settings,
//   },
// ]

// export function AppSidebar() {
//   return (
//     <Sidebar>
//       <SidebarContent>
//         <SidebarGroup>
//           <SidebarGroupLabel>Application</SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {items.map((item) => (
//                 <SidebarMenuItem key={item.title}>
//                   <SidebarMenuButton asChild>
//                     <a href={item.url}>
//                       <item.icon />
//                       <span>{item.title}</span>
//                     </a>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>
//               ))}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>
//     </Sidebar>
//   )
// }
//     </Sidebar>
//   )
// }
import { Calendar, Camera, Home, Inbox, LayoutDashboard, LogOut, Search, Settings, Share, User } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Camera",
    url: "camera",
    icon: Camera,
  },
  {
    title: "dashboard",
    url: "dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "export",
    url: "export",
    icon: Share,
  },
  {
    title: "profil",
    url: "profil",
    icon: User,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="z-20">
      <SidebarContent className="bg-blue-500 shadow-2xl justify-between pb-2 pl-2">
        <SidebarGroup className="pl-0">
          <SidebarGroupLabel className="h-20 justify-center"><img src="/LogoWitness2.png" alt="image"className="h-40 w-40"/></SidebarGroupLabel>
          <SidebarGroupContent className="mt-5 poppins-bold uppercase">
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-sky-300">
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarMenuButton  className="hover:bg-sky-300 flex bottom-0">
          <a href='u' className="flex gap-2 items-center">
            <LogOut size={16}/>
            <span className="poppins-bold">Log Out</span>
          </a>
          </SidebarMenuButton>
      </SidebarContent>
    </Sidebar>
  )
}