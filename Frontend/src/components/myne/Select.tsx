"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type props = {
    cameras: cameraOption[];
}
type cameraOption = {
    value: string,
    label: string,
}

export function Select({cameras}:props) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="ml-0 border flex">
        <button
        //   variant='default'
          role="combobox"
          aria-expanded={open}
          className="bg-white text-gray-800 pl-[-10px] hover:bg-white flex justify-start p-0"
        >
          {value
            ? cameras.find((camera) => camera.value === value)?.label
            : "Select camera"}
          <ChevronsUpDown className="opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[100px] p-0">
        <Command>
          <CommandInput placeholder="Search camera" className="h-8 pl-0" />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {cameras.map((camera) => (
                <CommandItem
                  key={camera.value}
                  value={camera.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  {camera.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === camera.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
