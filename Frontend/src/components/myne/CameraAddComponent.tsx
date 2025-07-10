import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { Label } from "../ui/label";

export default function CameraAddComponent() {
  const [lieux, setLieux] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [listeData, setListeData] = useState<string[]>(()=> {
    const saved = localStorage.getItem('listeData');
    return saved ? JSON.parse(saved) : [];
  })
  useEffect(() => {
    localStorage.setItem('listeData',JSON.stringify(listeData))
  },[listeData])
  const handleLieux = (e: ChangeEvent<HTMLInputElement>) => {
    setLieux(e.target.value);
  };

  const handleUrl = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  const createCamera = async (event: FormEvent) => {
      event.preventDefault(); // Empêche le rechargement de la page par défaut
  
      try {
        // The data you want to send in the POST request
        const requestBody = {
          ip_address: "test_video_2.mp4",
          label: "TestCam",
        };
        
        // The URL of your FastAPI endpoint for adding a camera
        const apiUrl = "http://127.0.0.1:8000/api/add_camera";
        
        // console.log("andy");
  
        // Perform the POST request
        fetch(apiUrl, {
          method: "POST", // Specify the POST method
          headers: {
            "Content-Type": "application/json", // Tell the server that you're sending JSON
          },
          body: JSON.stringify({ip_address:`${url}`,Label:`${lieux}`}), 
          // body: JSON.stringify(requestBody), // Convert your JavaScript object to a JSON string
        })
          .then((response) => {
            // Check if the response was successful (status code 2xx)
            if (!response.ok) {
              // If not successful, parse the error details from the response body (if available)
              return response.json().then((errorData) => {
                // Throw an error to be caught by the .catch block
                throw new Error(
                  errorData.detail || `HTTP error! Status: ${response.status}`
                );
              });
            }
            // If successful, parse the JSON response from the server
            return response.json();
          })
          .then((data) => {
            // Handle the successful response data
            console.log("Camera added successfully:", data);
            // Example: data might be { "status": "Started" }
            // You can update your UI here based on the success
          })
          .catch((error) => {
            // Handle any errors that occurred during the fetch operation (network error, thrown error)
            console.error("Error adding camera:", error.message);
            // You can display an error message to the user here
          });
     
          const apiurl = await fetch(`http://127.0.0.1:8000/stream/${requestBody.label}`);
          setListeData(prev => [...prev, apiurl.url]);
          console.log('andy est le meilleur');
          console.log(listeData);
          console.log(apiurl);
  
      } catch (err) {
        console.error("votre erreur est :", err);
      }
    };
  
    const Take = async (event: FormEvent) => {
      event.preventDefault()
  
      try {
        console.log
  
  
      }catch(err) {
        console.error('une erreur',err);
      }
    }
  return (
      <Dialog>
          <DialogTrigger asChild>
          <Card className="w-[475px] h-[300px] bg-white">
              <CardContent className=" h-full w-full flex justify-center items-center">
                  <div className="flex rounded-full border border-blue-500 w-50 h-50 justify-center items-center bg-neutral-300 cursor-pointer">
                      <Plus size={80} color="gray"/>
                  </div>
              </CardContent>
          </Card>
            
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] h-[300px] rounded-sm border-none">
            <DialogHeader>
              <DialogTitle className="">Nouvelle camera</DialogTitle>
              <DialogDescription className="text-black text-xs mt-[-12px]">
                ajouter les informations de votre nouvelle camera pour la
                visualiser !
              </DialogDescription>
            </DialogHeader>
            {/* Lier le onSubmit du formulaire à la fonction createCamera */}
            <form className="grid gap-4" onSubmit={createCamera}>
              <div className="grid gap-3 ">
                <Label htmlFor="name-1">Lieux</Label>
                <input
                  id="name-1"
                  name="name" // L'attribut `name` est utile pour la soumission classique ou React Hook Form
                  value={lieux}
                  onChange={handleLieux}
                  // Supprimer `defaultValue` car `value` est utilisé (composant contrôlé)
                  placeholder="Ex: Salon, Entrée" // Utilisez un placeholder au lieu de defaultValue
                  className="border-none focus-visible:border-top shadow-md ml-[-2px] focus-visible:border-white"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="username-1">Adresse IP</Label>
                <input
                  id="username-1"
                  name="username" // L'attribut `name` est utile pour la soumission classique ou React Hook Form
                  value={url}
                  onChange={handleUrl}
                  // Supprimer `defaultValue`
                  placeholder="Ex: rtsp://user:pass@192.168.1.100/stream" // Utilisez un placeholder
                  className="border-none focus-visible:border shadow-md ml-[-2px] border-white"
                />
              </div>
              <button
                type="submit"
                // disabled={isLoading} // Désactive le bouton pendant le chargement pour éviter les soumissions multiples
                className="bg-black text-white w-40 h-8 rounded-md poppins-bold mx-auto"
              >
                {/* {isLoading ? "Ajout en cours..." : "Ajouter"} */}
                ajouter
              </button>
            </form>
            {/* Afficher le message de statut (succès/erreur) */}
            
          </DialogContent>
        </Dialog>
  )
}