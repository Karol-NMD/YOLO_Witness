import { Card, CardContent } from "@/components/ui/card";
import ReactPlayer from 'react-player'

type props = {
  image: string
}
export default function CameraComponent({image}:props) {
  return (
    <div className="w-[475px] h-[300px] p-0">
        <div className=" h-full w-full">
          <ReactPlayer src={image} />
        </div>
    </div>
  )
}
