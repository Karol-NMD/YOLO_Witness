import CameraAddComponent from "@/components/myne/cameraAddComponent";
import CameraComponent from "@/components/myne/CameraComponent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Acceuil() {
useEffect(() => {
    fetch("http://localhost:8000/api/add_camera")
}, [])
  return (
    <div className="flex flex-col px-2 mt-2">
      <h2 className="text-end poppins-bold text-3xl">Vos Cameras</h2>
      <div className="flex justify-end w-full mb-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="h-8 hover:bg-blue-600 hover:text-white cursor-pointer capitalize">add Camera</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px] h-[300px] rounded-sm border-none">
            <DialogHeader>
              <DialogTitle className="">Nouvelle camera</DialogTitle>
                <DialogDescription className="text-black text-xs mt-[-12px]">ajouter les informations devotre nouvelle camera pour la visualiser !</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-3 ">
                <Label htmlFor="name-1">Lieux</Label>
                <Input 
                  id="name-1" 
                  name="name" 
                  defaultValue="lemagasin" 
                  className=" border-none focus-visible:border-top shadow-md ml-[-2px] focus-visible:border-white"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="username-1">address-ip</Label>
                <Input
                  id="username-1"
                  name="username"
                  defaultValue="mqtt://lemagasin"
                  className=" border-none focus-visible:border shadow-md ml-[-2px] border-white"
                />
              </div>
            </div>
            {/*<DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save changes</Button>
            </DialogFooter> */}
          </DialogContent>
        </Dialog>
      </div>
      {/* <div className="flex border h-[470px] overflow-hidden"> */}
        <div className="flex flex-wrap justify-between gap-8 overflow-scroll scrollbar-none">    
          <CameraComponent />
          <CameraComponent />
          <CameraComponent />
          <CameraAddComponent />
        </div>
      {/* </div> */}
    </div>
  );
}
