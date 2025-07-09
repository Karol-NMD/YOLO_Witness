import { Select } from "@/components/myne/Select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const cameras = [
    {
        value: "cuisine",
        label: "cuisine",
    },
    {
        value: "bureau",
        label: "bureau",
    },
    {
        value: "magasin",
        label: "magasin",
    },
    {
        value: "DT",
        label: "DT",
    },
    {
        value: "Dc",
        label: "Dc",
    },
]
export default function Dash() {
  return (
    <div className="flex w-full h-full overflow-hidden">
        <div className="flex items-center flex-col w-full">
            <h1 className="text-3xl poppins-bold text-center">Dashboard</h1>
            <p className="text-2xs w-full text-center mt-[-14px] mb-2 text-sky-300">verifier la camera que vous souhaitez avec plus de precision</p>
            <div className="flex justify-between w-[90%] h-18 px-2 shadow bg-white opacity-200 *:text-xs *:uppercase  poppins-bold">
                <div className="flex flex-col gap-1 h-full justify-around pl-2 items-start">
                    <label htmlFor="lieux">camera :</label>
                    <Select cameras={cameras} />
                </div>
                <div className="flex flex-col gap-1 h-full justify-around pl-2 items-start">
                    <label htmlFor="lieux">vitesse :</label>
                    <Select cameras={cameras} />
                </div>
                <div className="flex flex-col gap-1 h-full justify-around pl-2 items-start">
                    <label htmlFor="lieux">Zoom:</label>
                    <Select cameras={cameras} />
                </div>
            </div>
            <div className="flex shadow w-[90%] h-full my-2 bg-white">
                <video src="" className="w-full h-full"></video>
            </div>
        </div>
    </div>
  )
}

{/* <select id="lieux" className="border outline-none h-8 shadow-none focus-visible:border-none focus-visible:right-0 focus-visible:shadow-none appearance-auto focus-visible:outline-none">
    <option value="cuisine">cuisine</option>
    <option value="salon">salon</option>
    <option value="douche">douche</option>
    <option value="DT">DT</option>
    <option value="DC">DC</option>
    <option value="DM">DM</option>
    <option value="stagiare">stagiare</option>
    <option value="bureau">bureau</option>
</select> */}