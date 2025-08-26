"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { Maximize2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Camera {
  label: string;
  streamUrl: string;
}

export default function CamerasPage() {
  const [lieux, setLieux] = useState<string>("");
  const [ip_address, setIp_address] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [listeData, setListeData] = useState<Camera[]>(() => {
    const saved = localStorage.getItem("listeData");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("listeData", JSON.stringify(listeData));
  }, [listeData]);

  // useEffect(() => console.log(listeData),[])

  const handleLieux = (e: ChangeEvent<HTMLInputElement>) => setLieux(e.target.value);
  const handleIp = (e: ChangeEvent<HTMLInputElement>) => setIp_address(e.target.value);

  // add camera
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    
    try {
      const res = await fetch("http://127.0.0.1:8000/api/add_camera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: lieux, ip_address }),
      });

      const result = await res.json();
      if (result.status === "Started" || result.status === "Already running") {
        const streamUrl = `http://127.0.0.1:8000/stream/${lieux}`;
        setListeData((prev) => [...prev, { label: lieux, streamUrl }]);
        setMessage("Succès : caméra ajoutée !");
      } else {
        setMessage("Erreur : " + result.status);
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'ajout de la caméra.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // remove camera

  const DeleteCamera = async (label : string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/stop_camera?label=${label}`,{ method: "POST" })
      setListeData((prev) => prev.filter((cam) => cam.label !== label));
    } catch (err) {
      console.error('votre erreur est :',err);
    }
  }

  // delete all camera

  const removeVideos = () => {
    const removeAll = async () => {
      await fetch(`http://127.0.0.1:8000/api/stop_all`)
    }
    removeAll()
    setListeData([]);
    localStorage.removeItem("listeData");
  };
  
  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex justify-between">
        <div>
          <SidebarTrigger className="text-white hover:bg-slate-800" />
          <h1 className="text-2xl font-bold text-white">Surveillance Caméras</h1>
          <p className="text-slate-400">Vue d'ensemble de toutes les caméras connectées</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={removeVideos}>Remove All</Button>
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
                    value={lieux}
                    onChange={handleLieux}
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
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Ajout..." : "Ajouter"}
                </Button>
              </form>
              {message && <p className="text-center mt-2">{message}</p>}
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listeData.map((camera, index) => (
          <Card key={index} className="bg-slate-900/50 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{camera.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative group">
                <img
                  src={camera.streamUrl}
                  alt={camera.label}
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
                      <img src={camera.streamUrl} alt={camera.label} className="max-h-full max-w-full" />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-900/20 border border-green-800 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm">Aucune alerte</span>
              </div>
              <div className="flex items-center group justify-center gap-2 mt-2 p-2 bg-red-900/20 border border-red-800 duration-500 hover:bg-red-800 rounded-lg" onClick={() => DeleteCamera(camera.label)}>
                <span className="text-red-800 cursor-pointer group-hover:text-white duration-500 text-sm">supprimer cette angle</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </main>
    </div>
  );
}
