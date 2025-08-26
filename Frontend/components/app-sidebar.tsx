"use client"

import { Camera, BarChart3, Download, Shield, Settings, User, Search } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const mainNavItems = [
  {
    title: "Caméras",
    url: "/",
    icon: Camera,
    description: "Vue d'ensemble des caméras",
  },
  {
    title: "precision",
    url: "/precision",
    icon: Search,
    description: "Analyse détaillée",
  },
  {
    title: "Export",
    url: "/export",
    icon: Download,
    description: "Exportation des données",
  },
]

const secondaryNavItems = [
  {
    title: "Paramètres",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-slate-800">
      <SidebarHeader className="border-b border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-00/30">
            {/* <Shield className="h-6 w-6 text-white" /> */}
            <img src="/LogoWitness2.png" alt="logo" className="shadow-3xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Witness</h1>
            <p className="text-xs text-slate-400">Surveillance Intelligente</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2 overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Navigation Principale
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="data-[active=true]:bg-blue-600 h-10 data-[active=true]:text-white hover:bg-slate-800"
                  >
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <item.icon className="h-5 w-5" />
                      <div className="flex flex-col">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-slate-400">{item.description}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-slate-800" />

        {/* <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Système
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-slate-800">
                    <Link href={item.url} className="flex items-center gap-3 p-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 p-4">
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 p-3 hover:bg-slate-800">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="bg-blue-600 text-white">AD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-white">Admin</span>
                <span className="text-xs text-slate-400">admin@witness.com</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
            <DropdownMenuItem className="hover:bg-slate-800">
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-slate-800">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-slate-800 text-red-400">Déconnexion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </SidebarFooter>
    </Sidebar>
  )
}
