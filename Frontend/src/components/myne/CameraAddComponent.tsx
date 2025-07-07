import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function CameraAddComponent() {
  return (
    <Card className="w-[475px] h-[300px] bg-sky-300">
        <CardContent className=" h-full w-full flex justify-center items-center">
            <div className="flex rounded-full border border-blue-500 w-50 h-50 justify-center items-center bg-neutral-300 cursor-pointer">
                <Plus size={80} color="gray"/>
            </div>
        </CardContent>
    </Card>
  )
}
