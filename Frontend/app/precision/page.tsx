"use client"

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  Settings,
  Users,
  Car,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const cameras = [
  { id: 1, name: "Entrée Principale", location: "Hall d'accueil" },
  { id: 2, name: "Parking Nord", location: "Zone extérieure" },
  { id: 3, name: "Couloir Bureau", location: "Étage 2" },
  { id: 4, name: "Sortie Secours", location: "Arrière bâtiment" },
];

const aiDetections = [
  {
    type: "person",
    count: 12,
    confidence: 95,
    icon: Users,
    color: "text-blue-400",
  },
  {
    type: "vehicle",
    count: 3,
    confidence: 88,
    icon: Car,
    color: "text-green-400",
  },
  {
    type: "package",
    count: 2,
    confidence: 92,
    icon: Package,
    color: "text-yellow-400",
  },
];

const recentEvents = [
  {
    time: "14:32",
    event: "Personne détectée - Zone d'entrée",
    severity: "info",
  },
  {
    time: "14:28",
    event: "Véhicule non autorisé - Parking",
    severity: "warning",
  },
  { time: "14:25", event: "Mouvement suspect détecté", severity: "alert" },
  {
    time: "14:20",
    event: "Accès autorisé - Badge scanné",
    severity: "success",
  },
];

interface Camera {
  label: string;
  streamUrl: string;
}

export default function Precision() {
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [message, setMessage] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const [listeData, setListeData] = useState<Camera[]>([]);
  const [image, setImage] = useState<string>("");
  useEffect(() => {
    const data = localStorage.getItem("listeData");
    if (data) {
      const parsed = JSON.parse(data);
      setListeData(parsed);
    }
  }, []);

  // pour voir la valeur de liste data car setListeData est async
  useEffect(() => {
    // console.log(listeData);
    setSelectedCamera(listeData[0]?.label);
  }, [listeData]);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setCurrentTime(new Date());
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, []);

  useEffect(() => setSelectedCamera(listeData?.[0]?.label), []);

  useEffect(() => {
    if (!listeData.length || !selectedCamera) return; // sécurité
    const i = listeData.filter((data) => data.label === selectedCamera);
    if (i.length > 0) {
      const u = i[0].streamUrl;
      // console.log(u);
      setImage(u);
    }
  }, [selectedCamera, listeData]);

  useEffect(() => {
    // 1. Ouvrir la connexion
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/events");
    wsRef.current = ws;

    // 2. Quand la connexion est ouverte
    ws.onopen = () => {
      console.log("✅ WebSocket connecté !");
      ws.send("Hello backend 👋"); // tu peux envoyer un message
    };

    // 3. Quand un message arrive
    ws.onmessage = (event) => {
      const jsonMessage = JSON.parse(event.data)
      console.log("📩 Message reçu :", jsonMessage);
    };

    // 4. En cas d’erreur
    ws.onerror = (err) => {
      console.error("❌ Erreur WebSocket:", err);
    };

    // 5. Quand la connexion se ferme
    ws.onclose = () => {
      console.log("🔌 WebSocket fermé");
    };

    // 6. Nettoyage quand le composant est démonté
    return () => {
      ws.close();
    };
  }, []);


  return (
    // <div className="flex h-screen overflow-hidden">
    <div className="h-screen bg-slate-950 overflow-y-hidde">
      <header className="px-4 pt-2">
        <div className="flex items-center justify-between flex-wrap p-6 *:w-1/2 *:h-full border border-slate-800 bg-slate-900/50 backdrop-blur-sm rounded-2xl">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-white hover:bg-slate-800" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Dashboard Surveillance
              </h1>
              <p className="text-slate-400">Analyse en temps réel avec IA</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full text-center mt-2 justify-end">
            <Badge className="bg-green-600 text-white">
              {/* ● LIVE - {currentTime.toLocaleTimeString()} */}
            </Badge>
            <Select
              value={selectedCamera}
              onValueChange={setSelectedCamera}
              defaultValue={listeData[0]?.label} // ✅ ici le default
            >
              <SelectTrigger className="w-full lg:w-64 bg-slate-800 border-slate-700 text-white">
                <SelectValue
                  placeholder={listeData[0]?.label}
                  className="placeholder:text-white placeholder-shown:text-whiteplaceholder:font-black"
                />
              </SelectTrigger>

              <SelectContent className="bg-slate-800 border-slate-700">
                {listeData?.map((camera, index) => (
                  <SelectItem
                    key={index}
                    value={camera.label}
                    className="text-white hover:bg-slate-700"
                  >
                    {camera.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="px-4 py-2 lg:h-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 lg:h-full ">
          {/* Video Feed */}
          <div className="flex lg:col-span-3 ">
            <div className="bg-whit h-full w-full">
              <Card className="bg-slate-900/50 border-slate-800 p-0 gap-0 pb-2 h-ful">
                <CardHeader className="p-2 ">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white pb-0">
                      {selectedCamera}
                    </CardTitle>
                    <p className="text-slate-400">
                      {/* {selectedCameraData?.location} */}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="py-0 px-2 w-full mt-0">
                  <div className="relative">
                    <img
                      src={image || `FileArchiveIcon.ico`}
                      alt="Live camera feed"
                      className="w-full h-96 object-cover rounded-lg bg-slate-800"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="flex overflow-hidden">
            <div className="space-y-2 overflow-y-scroll w-full h-[100%] scrollBar ">
              {/* Detection Stats */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Détections IA</CardTitle>4
                </CardHeader>
                <CardContent className="space-y-4">
                  {aiDetections.map((detection, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <detection.icon
                          className={`h-5 w-5 ${detection.color}`}
                        />
                        <span className="text-white capitalize">
                          {/* {detection.type} */}
                          personne
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">
                          {/* {detection.count} */}
                          12
                        </div>
                        <div className="text-xs text-slate-400">
                          {/* {detection.confidence} */}% conf.
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* System Status */}
              {/* <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">État du Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">CPU Usage</span>
                    <span className="text-white">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Mémoire</span>
                    <span className="text-white">62%</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">Stockage</span>
                    <span className="text-white">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </CardContent>
            </Card> */}

              {/* Recent Events */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Événements Récents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-start gap-3 p-2 rounded-lg bg-slate-800/50"
                    >
                      <div className="text-xs text-slate-400 mt-1 min-w-12">
                        {/* {event.time} */}
                        12:30
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{event.event}</p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${
                            event.severity === "alert"
                              ? "border-red-500 text-red-400"
                              : event.severity === "warning"
                              ? "border-yellow-500 text-yellow-400"
                              : event.severity === "success"
                              ? "border-green-500 text-green-400"
                              : "border-blue-500 text-blue-400"
                          }`}
                        >
                          {event.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
    // </div>
  );
}
