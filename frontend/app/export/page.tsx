"use client";

import { useEffect, useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCameraContext } from "@/context/cameraContext";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function ExportPage() {
  const { cameras, selectExport, loading, dataExport, DownloadPDF } = useCameraContext();
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    selectExport(selectedCamera ? selectedCamera : cameras[0]?.label);
  }, [cameras, selectExport, selectedCamera])

  const handleChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
  };
  const handleChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
  };
  useEffect(() => {
    console.log(dataExport);
  }, [dataExport]);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="px-4 pt-4">
        <div className="flex items-center justify-between border rounded-2xl border-slate-800 bg-slate-900/50 backdrop-blur-sm  p-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-white hover:bg-slate-800" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Export de Données
              </h1>
              <p className="text-slate-400">
                Exportation et téléchargement des données de surveillance
              </p>
            </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-white hover:bg-slate-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger en PDF
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form
                  className="grid gap-4 "
                  onSubmit={(e) => {
                    e.preventDefault();
                    DownloadPDF(startDate, endDate, "salon", "person");
                  }}
                >
                  <div className="*:mb-2">
                    <Label>start date</Label>
                    <input
                      // type="date"
                      value={startDate}
                      onChange={handleChanges}
                      placeholder="12h-34"
                      className="w-full p-2"
                    />
                  </div>
                  <div className="*:mb-2">
                    <Label>End date</Label>
                    <input
                      value={endDate}
                      // type="date"
                      onChange={handleChanged}
                      placeholder="14h-00"
                      className="w-full p-2"
                    />
                  </div>
                  <div className="*:mb-2">
                    <Label></Label>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Export..." : "exporter en PDF  "}
                  </Button>
                </form>
                {/* <Button>Exporter</Button> */}
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-white hover:bg-slate-800"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger en CVS
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form
                  className="grid gap-4 "
                  // onSubmit={handleSubmit}
                >
                  <div className="*:mb-2">
                    <Label>start date</Label>
                    <input
                      value={startDate}
                      onChange={handleChanges}
                      placeholder="13h-34"
                      className="w-full p-2"
                    />
                  </div>
                  <div className="*:mb-2">
                    <Label>end Date</Label>
                    <input
                      value={endDate}
                      onChange={handleChanged}
                      placeholder="14h-00"
                      className="w-full p-2"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Export..." : "exporter en CVS"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
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

      <main className="px-4 pt-4">
        <div className="w-full h-full">
          <table className="w-ful h-full *:bg-slate-900/50 border border-slate-800">
            <thead>
              <tr className="*:w-1/6 *:text-center *:border-1 font-bold uppercase text-blue-600 *:py-1">
                <td>type</td>
                <td>event</td>
                <td>confidences</td>
                <td>date</td>
                <td>time</td>
                <td>image</td>
              </tr>
            </thead>
            <tbody>
              {dataExport.map((el, index) => (
                <tr key={index} className="*:text-center *:w-1/6">
                  <td>{el.type}</td>
                  <td>{el.event}</td>
                  <td>{el?.confidence?.toFixed(3)}</td>
                  <td>{el.date}</td>
                  <td>{el.time}</td>
                  {/* <td>{el.thumbnail}</td> */}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} className="p-1">
                  <Badge className="bg-blue-600 mx-auto text-white">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Format Excel
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </main>
    </div>
  );
}
