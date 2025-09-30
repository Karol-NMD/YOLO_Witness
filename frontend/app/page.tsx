"use client";

import { ChangeEvent, useState } from "react";
import { Maximize2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCameraContext } from "@/context/cameraContext";
import Image from "next/image";

export default function CamerasPage() {
  const { cameras, loading, addCamera, deleteCamera, deleteAll } = useCameraContext();
  const [label, setLabel] = useState<string>("");
  const [ip_address, setIp_address] = useState<string>("");
  const handleLabel = (e: ChangeEvent<HTMLInputElement>) => setLabel(e.target.value);
  const handleIp = (e: ChangeEvent<HTMLInputElement>) => setIp_address(e.target.value);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCamera({ label, ip_address });
    setIp_address("");
    setLabel("");
  };
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex justify-between">
        <div>
          <SidebarTrigger className="text-white hover:bg-slate-800" />
          <h1 className="text-2xl font-bold text-white">Surveillance Caméras</h1>
          <p className="text-slate-400">Vue d&apos;ensemble de toutes les caméras connectées</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={deleteAll}>Remove All</Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Ajouter caméra</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] h-[400px] bg-slate-950 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Nouvelle caméra</DialogTitle>
                <DialogDescription>Ajoutez les informations de votre caméra</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 " onSubmit={handleSubmit}>
                <div className="*:mb-2">
                  <Label>Lieux</Label>
                  <input
                    value={label}
                    onChange={handleLabel}
                    placeholder="Ex: Salon"
                    className="w-full p-2"
                  />
                </div>
                <div className="*:mb-2">
                  <Label>Adresse IP</Label>
                  <input
                    value={ip_address}
                    onChange={handleIp}
                    placeholder="rtsp://user:pass@192.168.1.100/stream"
                    className="w-full p-2"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Ajout..." : "Ajouter"}
                </Button>
              </form>
              {/* {message && <p className="text-center mt-2">{message}</p>} */}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(cameras) &&
          cameras?.map((camera, index) => (
            <Card key={index} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">{camera.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <Image
                    src={camera.streamUrl ? camera.streamUrl : "/LogoWitness.png"}
                    alt={camera.label}
                    width={400}
                    height={300}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                    <Dialog>
                      <DialogTrigger>
                        <p className="bg-blue-600">
                          <Maximize2 />
                        </p>
                      </DialogTrigger>
                      <DialogContent className="bg-transparent p-0 min-w-full h-screen flex items-center justify-center">
                        <Image
                          src={camera.streamUrl}
                          alt={camera.label}
                          width={800}
                          height={600}
                          className="max-h-full max-w-full"
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-900/20 border border-green-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 text-sm">Aucune alerte</span>
                </div>
                <div
                  className="flex items-center group justify-center gap-2 mt-2 p-2 bg-red-900/20 border border-red-800 duration-500 hover:bg-red-800 rounded-lg"
                  onClick={() => deleteCamera(camera.label)}
                >
                  <span className="text-red-800 cursor-pointer group-hover:text-white duration-500 text-sm">
                    supprimer cette angle
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
      </main>
    </div>
  );
}
