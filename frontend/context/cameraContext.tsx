"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AddCameraTypePost {
  label: string;
  ip_address: string;
}
interface AddCameraType {
  label: string;
  streamUrl: string;
}
interface Per {
  box: number;
  camera: string;
  people: number;
  vehicle: number;
}
interface Counts {
  vehicle: number;
  box: number;
  people: number;
}
// interface ReponseInterface extends AddCameraType{
interface ReponseInterface {
  total: Counts;
  per_camera: Per[];
  date: string;
}

interface dataExportInterface {
  type: string;
  class: string;
  time: string;
  date: string;
  event: string;
  confidence: number;
  thumbnail: string;
  // type:string,
}

type CameraContextType = {
  cameras: AddCameraType[];
  loading: boolean;
  dataExport: dataExportInterface[];
  dataPrecision: ReponseInterface;
  addCamera: (cam: AddCameraTypePost) => Promise<void>;
  deleteCamera: (label: string) => Promise<void>;
  getPerPrecision: (name: string) => void;
  selectExport: (sector: string) => void;
  deleteAll: () => Promise<void>;
  perPrecision: Per;
  DownloadPDF: (
    startDate: string,
    endDate: string,
    label: string,
    classe: string
  ) => void;
};

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [cameras, setCameras] = useState<AddCameraType[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataExport, setDataExport] = useState<dataExportInterface[]>([]);
  const [dataPrecision, setDataPrecision] = useState<ReponseInterface>({
    total: { box: 0, people: 0, vehicle: 0 },
    per_camera: [],
    date: "",
  });
  const [perPrecision, setPerPrecision] = useState<Per>({
    box: 0,
    camera: "",
    people: 0,
    vehicle: 0,
  });

  // Charger les caméras depuis localStorage côté client
  useEffect(() => {
    const stored = localStorage.getItem("cameraData");
    // if (stored) setCameras(JSON.parse(stored));
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setCameras(parsed);
        else setCameras([]); // fallback au cas où
      } catch (e) {
        console.error("Erreur de parsing localStorage:", e);
        setCameras([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cameraData", JSON.stringify(cameras));
  }, [cameras]);

  const addCamera = async ({ label, ip_address }: AddCameraTypePost) => {
    setLoading(true);
    try {
      const base1 = "http://127.0.0.1:8000/api/add_camera";
      const res1 = await fetch(base1, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, ip_address }),
      });
      if (!res1.ok) throw new Error("Erreur réseau");
      const data1 = await res1.json();
      console.log("camera", label, "ajouter, votre statut est", data1);
      const streamUrl = `http://127.0.0.1:8000/stream/${label}`;
      setCameras((prev) => [...prev, { label, streamUrl }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCamera = async (label: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/stop_camera?label=${label}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: label,
      });
      if (!res.ok) throw new Error("Erreur réseau");
      setCameras((prev) => prev.filter((cam) => cam.label !== label));
      console.log(`Caméra ${label} supprimée`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/stop_all", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur réseau");
      setCameras([]);
      console.log("Toutes les caméras supprimées");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPerPrecision = (name: string) => {
    if (dataPrecision?.per_camera.length === 0) {
      console.log("error andy");
      return;
    }
    const u = dataPrecision.per_camera.find((items) => items.camera == name);
    if (!u) {
      console.log("u est undefined");
      return;
    }
    if (u) {
      console.log("u est :", u);
      setPerPrecision(u);
    }
  };

  const DownloadPDF = async (
    startDate: string,
    endDate: string,
    label: string,
    classe: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/export/pdf?start=${startDate}&end=${endDate}&label=${label}&class=${classe}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement du PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "detections.pdf"; // nom du fichier téléchargé
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const realTimePrecision = () => {
      if (cameras.length === 0) return;
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/counts-list");
      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);
          // console.log(JSON.parse(event.data));
          setDataPrecision(res);
        } catch (err) {
          console.error(err);
        }
      };
    };
    realTimePrecision();
  }, [cameras]);

  useEffect(() => {
    const realTimeExport = () => {
      if (cameras.length === 0) return;
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/events");
      ws.onmessage = (event) => {
        // console.log("donnée recu du ws export est :", JSON.parse(event.data));
        setDataExport((prev) => [...prev, JSON.parse(event.data)]);
      };
    };
    realTimeExport();
  }, [dataExport, cameras]);

  const selectExport = (sector: string) => {
    const filtered = dataExport.filter((item) => item.type === sector);
    setDataExport(filtered);
  }

  return (
    <CameraContext.Provider
      value={{
        cameras,
        loading,
        dataExport,
        perPrecision,
        dataPrecision,
        getPerPrecision,
        deleteCamera,
        selectExport,
        DownloadPDF,
        deleteAll,
        addCamera,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

// Hook pratique pour utiliser ton context
export function useCameraContext() {
  const context = useContext(CameraContext);
  if (!context)
    throw new Error(
      "useCameraContext doit être utilisé dans un CameraProvider"
    );
  return context;
}
