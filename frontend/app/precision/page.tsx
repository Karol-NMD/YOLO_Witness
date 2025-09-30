"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useCameraContext } from "@/context/cameraContext";
import { Badge } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Per {
  box: number;
  name: string;
  people: number;
  vehicle: number;
}
interface counts {
  vehicle: number;
  box: number;
  people: number;
}

export default function Precision() {
  const { cameras, dataPrecision, getPerPrecision, perPrecision } = useCameraContext();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [image, setImage] = useState<string>(cameras[0]?.streamUrl);

  useEffect(() => {
    if (!cameras.length || !selectedCamera) return; // sécurité
    if (selectedCamera == null) return;
    getPerPrecision(selectedCamera);
    const i = cameras.filter((data) => data.label === selectedCamera);
    if (i.length > 0) {
      const u = i[0].streamUrl;
      setImage(u);
    }
  }, [selectedCamera, dataPrecision, cameras, getPerPrecision]);

  return (
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
              value={selectedCamera ? selectedCamera : ""}
              onValueChange={setSelectedCamera}
              defaultValue={cameras[0]?.label} // ✅ ici le default
            >
              <SelectTrigger className="w-full lg:w-64 bg-slate-800 border-slate-700 text-white">
                <SelectValue
                  placeholder={cameras[0]?.label}
                  className="placeholder:text-white placeholder-shown:text-whiteplaceholder:font-black"
                />
              </SelectTrigger>

              <SelectContent className="bg-slate-800 border-slate-700">
                {cameras?.map((camera, index) => (
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
                    <Image
                      src={image ? image : `FileArchiveIcon.ico`}
                      alt="Live camera feed"
                      width={800}
                      height={400}
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
                  <CardTitle className="text-white">Détections IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* {liste.map((el, index) => ( */}
                  <div
                    // key={index}
                    className="flex flex-col *:w-full  items-center justify-between"
                  >
                    <div className="flex w-full justify-between px-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white capitalize">personne</span>
                      </div>
                      <div className="text-xs text-slate-400 text-rigth">
                        {perPrecision?.people}
                      </div>
                    </div>
                    <div className="flex w-full justify-between px-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white capitalize">vehicule</span>
                      </div>
                      <div className="text-xs text-slate-400 text-rigth">
                        {perPrecision?.vehicle}
                      </div>
                    </div>
                    <div className="flex w-full justify-between px-2">
                      <div className="flex items-center gap-3">
                        <span className="text-white capitalize">boxes</span>
                      </div>
                      <div className="text-xs text-slate-400 text-rigth">
                        {perPrecision?.box}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">
                    Événements Récents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* {recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-start gap-3 p-2 rounded-lg bg-slate-800/50"
                    >
                      <div className="text-xs text-slate-400 mt-1 min-w-12">
                        12:30
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white">{event.event}</p>
                        <Badge
                          // variant="outline"
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
                  ))} */}
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
