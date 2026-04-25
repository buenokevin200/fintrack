"use client"

import { forwardRef } from "react"
import ReactDatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  id?: string
}

const shortcuts = [
  { label: "Hoy", days: 0 },
  { label: "Mañana", days: 1 },
  { label: "+7 días", days: 7 },
  { label: "+15 días", days: 15 },
  { label: "+30 días", days: 30 },
  { label: "+90 días", days: 90 },
]

const DatePicker = forwardRef<ReactDatePicker, DatePickerProps>(
  ({ value, onChange, placeholder, className, required, id }, ref) => {
    const selected = value ? new Date(value + (value.includes("T") ? "" : "T00:00:00")) : null

    const handleChange = (date: Date | null) => {
      if (date) {
        onChange(date.toISOString().split("T")[0])
      }
    }

    return (
      <ReactDatePicker
        ref={ref}
        id={id}
        selected={selected}
        onChange={handleChange}
        dateFormat="dd/MM/yyyy"
        placeholderText={placeholder || "Seleccionar fecha"}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        wrapperClassName="w-full"
        required={required}
        todayButton="Hoy"
        showYearDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={10}
      >
        <div className="p-2 border-t">
          <p className="text-xs text-muted-foreground mb-2 font-medium">Atajos</p>
          <div className="flex flex-wrap gap-1">
            {shortcuts.map((s) => (
              <button
                key={s.label}
                type="button"
                className="text-xs px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  const d = new Date()
                  d.setDate(d.getDate() + s.days)
                  handleChange(d)
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </ReactDatePicker>
    )
  }
)

DatePicker.displayName = "DatePicker"

export { DatePicker }
