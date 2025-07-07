import { Card, CardContent } from "@/components/ui/card";

export default function CameraComponent() {
  return (
    <Card className="w-[475px] h-[300px] bg-sky-300">
        <CardContent className=" h-full w-full">
          <video src="/"></video>
        </CardContent>
    </Card>
  )
}
