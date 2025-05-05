"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Gerar horários de 30 em 30 minutos
  const timeOptions = React.useMemo(() => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
      for (const minute of [0, 30]) {
        const formattedHour = hour.toString().padStart(2, "0")
        const formattedMinute = minute.toString().padStart(2, "0")
        options.push(`${formattedHour}:${formattedMinute}`)
      }
    }
    return options
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Selecione um horário"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="h-[300px] overflow-y-auto p-2">
          <div className="grid grid-cols-2 gap-2">
            {timeOptions.map((time) => (
              <Button
                key={time}
                variant={time === value ? "default" : "ghost"}
                className={cn("justify-start", time === value && "bg-red-600 hover:bg-red-700 text-white")}
                onClick={() => onChange(time)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
