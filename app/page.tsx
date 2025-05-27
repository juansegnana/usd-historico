"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import * as chrono from "chrono-node"

export default function ExchangeRateApp() {
  const [input, setInput] = useState("")
  const [parsedDate, setParsedDate] = useState<Date | null>(null)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const today = new Date()
    setParsedDate(today)
    
    const fetchTodayRate = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/exchange-rate?date=today`)
        if (!response.ok) throw new Error('API request failed')
        const data = await response.json()
        setExchangeRate(data.rate)
      } catch (err) {
        console.error('Error fetching today\'s rate:', err)
        setError('Could not load today\'s exchange rate')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTodayRate()
  }, [])

  const suggestions = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last week", value: "last week" },
    { label: "A month ago", value: "a month ago" },
    { label: "A year ago", value: "a year ago" },
  ]

  const parseDate = async (dateInput: string) => {
    if (!dateInput.trim()) {
      setError("Please enter a date")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const results = chrono.parse(dateInput)

      if (results.length > 0) {
        const date = results[0].start.date()
        setParsedDate(date)

        const formattedDate = date.toISOString().split("T")[0]
        const apiDate = dateInput.toLowerCase() === 'today' ? 'today' : formattedDate
        const response = await fetch(`/api/exchange-rate?date=${apiDate}`)
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`)
        }
        
        const data = await response.json()
        setExchangeRate(data.rate)
        // console.log(`Fetched exchange rate for ${formattedDate}: ${data.rate} ARS`)
      } else {
        setError("Could not parse the date. Please try a different format.")
      }
    } catch (err) {
      setError("Error parsing date. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    parseDate(suggestion)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    parseDate(input)
  }

  const formatExchangeRate = (rate: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rate)
  }

  const formatDateDisplay = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: "url('/background.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <div className="space-y-2">
            <h1 className="text-white/90 text-xl md:text-2xl font-light tracking-wide">USD to ARS Exchange Rate</h1>
            {parsedDate && <p className="text-white/70 text-sm md:text-base">{formatDateDisplay(parsedDate)}</p>}
          </div>

          <div className="space-y-4">
            {exchangeRate ? (
              <div className="text-white font-light">
                <span className="text-4xl md:text-6xl lg:text-7xl">${formatExchangeRate(exchangeRate)}</span>
                <span className="text-xl md:text-2xl ml-2 text-white/80">ARS</span>
              </div>
            ) : (
              <div className="text-white/60 text-2xl md:text-4xl">{isLoading ? "Loading..." : "Enter a date"}</div>
            )}
          </div>

          <div className="space-y-6 w-full max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter date (e.g., 'yesterday', 'last week')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 text-center backdrop-blur-sm h-12 text-lg"
              />
            </form>

            {error && (
              <div className="text-red-300 text-sm text-center bg-red-500/20 p-3 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((suggestion) => (
                <Badge
                  key={suggestion.value}
                  variant="secondary"
                  className="cursor-pointer bg-white/10 text-white/90 hover:bg-white/20 transition-all duration-200 backdrop-blur-sm border-white/20"
                  onClick={() => handleSuggestionClick(suggestion.value)}
                >
                  {suggestion.label}
                </Badge>
              ))}
            </div>

            <div className="text-white/50 text-xs text-center">Data provided by Bluelytics API</div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-2 right-2 text-white/60 text-xs z-10">
        <div dangerouslySetInnerHTML={{ 
          __html: 'Photo by <a href="https://unsplash.com/es/@usgs?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash" class="underline hover:text-white/80">USGS</a> on <a href="https://unsplash.com/es/fotos/vista-aerea-del-paisaje-desertico-y-las-formaciones-siKUDDi4o64?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash" class="underline hover:text-white/80">Unsplash</a>' 
        }} />
      </div>
    </div>
  )
}
