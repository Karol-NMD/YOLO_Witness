"use client"

import { useState } from "react"
import { Download, Filter, FileSpreadsheet, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

const exportTemplates = [
  {
    id: "daily-report",
    name: "Rapport Quotidien",
    description: "Résumé des activités de la journée",
    fields: ["Détections", "Alertes", "Événements", "Statistiques"],
  },
  {
    id: "security-incidents",
    name: "Incidents de Sécurité",
    description: "Tous les incidents et alertes",
    fields: ["Alertes", "Événements critiques", "Réponses"],
  },
  {
    id: "analytics-data",
    name: "Données d'Analyse",
    description: "Données brutes pour analyse",
    fields: ["Détections IA", "Métadonnées", "Timestamps"],
  },
]

const recentExports = [
  {
    id: 1,
    name: "Rapport_Quotidien_2024-01-15.xlsx",
    type: "daily-report",
    date: "2024-01-15",
    size: "2.4 MB",
    status: "completed",
  },
  {
    id: 2,
    name: "Incidents_Semaine_03.xlsx",
    type: "security-incidents",
    date: "2024-01-14",
    size: "1.8 MB",
    status: "completed",
  },
  {
    id: 3,
    name: "Analytics_Janvier_2024.xlsx",
    type: "analytics-data",
    date: "2024-01-13",
    size: "5.2 MB",
    status: "processing",
  },
]

export default function ExportPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [selectedCameras, setSelectedCameras] = useState<string[]>([])
  const [includeImages, setIncludeImages] = useState<boolean>(false)
  const [includeVideo, setIncludeVideo] = useState<boolean>(false)

  const handleExport = () => {
    // Simulation d'export
    console.log("Exporting with:", {
      template: selectedTemplate,
      dateRange: { from: dateFrom, to: dateTo },
      cameras: selectedCameras,
      includeImages,
      includeVideo,
    })
    alert("Export lancé ! Vous recevrez une notification une fois terminé.")
  }

  const cameras = [
    "Entrée Principale",
    "Parking Nord",
    "Couloir Bureau",
    "Sortie Secours",
    "Salle Serveur",
    "Réception",
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="px-4 pt-4">
        <div className="flex items-center justify-between border rounded-2xl border-slate-800 bg-slate-900/50 backdrop-blur-sm  p-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-white hover:bg-slate-800" />
            <div>
              <h1 className="text-2xl font-bold text-white">Export de Données</h1>
              <p className="text-slate-400">Exportation et téléchargement des données de surveillance</p>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Format Excel
          </Badge>
        </div>
      </header>

      <main className="px-4 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Export Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Configuration d'Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Template Selection */}
                <div className="space-y-3">
                  <Label className="text-white">Modèle d'Export</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Sélectionner un modèle" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {exportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id} className="text-white hover:bg-slate-700">
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-slate-400">{template.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Date de début</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Date de fin</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                </div>

                {/* Camera Selection */}
                <div className="space-y-3">
                  <Label className="text-white">Caméras à inclure</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {cameras.map((camera) => (
                      <div key={camera} className="flex items-center space-x-2">
                        <Checkbox
                          id={camera}
                          checked={selectedCameras.includes(camera)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCameras([...selectedCameras, camera])
                            } else {
                              setSelectedCameras(selectedCameras.filter((c) => c !== camera))
                            }
                          }}
                          className="border-slate-600"
                        />
                        <Label htmlFor={camera} className="text-white text-sm">
                          {camera}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <Label className="text-white">Options supplémentaires</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-images"
                        checked={includeImages}
                        // onCheckedChange={setIncludeImages}
                        className="border-slate-600"
                      />
                      <Label htmlFor="include-images" className="text-white text-sm">
                        Inclure les captures d'écran
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="include-video"
                        checked={includeVideo}
                        // onCheckedChange={setIncludeVideo}
                        className="border-slate-600"
                      />
                      <Label htmlFor="include-video" className="text-white text-sm">
                        Inclure les clips vidéo
                      </Label>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleExport}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedTemplate || !dateFrom || !dateTo}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Lancer l'Export
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Templates & Recent Exports */}
          <div className="space-y-6">
            {/* Template Preview */}
            {selectedTemplate && (
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Aperçu du Modèle</CardTitle>
                </CardHeader>
                <CardContent>
                  {exportTemplates.find((t) => t.id === selectedTemplate) && (
                    <div className="space-y-3">
                      <h3 className="text-white font-medium">
                        {exportTemplates.find((t) => t.id === selectedTemplate)?.name}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {exportTemplates.find((t) => t.id === selectedTemplate)?.description}
                      </p>
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Champs inclus :</Label>
                        <div className="flex flex-wrap gap-2">
                          {exportTemplates
                            .find((t) => t.id === selectedTemplate)
                            ?.fields.map((field) => (
                              <Badge key={field} variant="outline" className="border-blue-500 text-blue-400">
                                {field}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Exports */}
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Exports Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentExports.map((exportItem) => (
                    <div
                      key={exportItem.id}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="text-white text-sm font-medium truncate">{exportItem.name}</div>
                        <div className="text-slate-400 text-xs">
                          {exportItem.date} • {exportItem.size}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            exportItem.status === "completed"
                              ? "border-green-500 text-green-400"
                              : "border-yellow-500 text-yellow-400"
                          }
                        >
                          {exportItem.status === "completed" ? "Terminé" : "En cours"}
                        </Badge>
                        {exportItem.status === "completed" && (
                          <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-slate-700">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
