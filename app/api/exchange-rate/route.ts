import { type NextRequest, NextResponse } from "next/server"

interface HistoricalAPIResponse {
  blue: {
    value_sell: number;
  };
}

interface LatestAPIResponse {
  blue: {
    value_sell: number;
  };
  last_update: string;
}

interface BlueRate {
  value_sell: number;
  date: string;
}

const CACHE_EXPIRY = {
  HISTORICAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  LATEST: 15 * 60 * 1000, // 15 minutes in milliseconds
};

const API_BASE_URL = "https://api.bluelytics.com.ar/v2";

const memoryCache = new Map<string, { data: any; timestamp: number }>();

async function fetchHistoricalBlueRate(date: string): Promise<BlueRate> {
  const cacheKey = `historical_${date}`;
  
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY.HISTORICAL) {
    return cachedData.data;
  }
  
  const response = await fetch(`${API_BASE_URL}/historical?day=${date}`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as HistoricalAPIResponse;
  const historicalRate: BlueRate = {
    value_sell: data.blue.value_sell,
    date: date,
  };
  
  memoryCache.set(cacheKey, { data: historicalRate, timestamp: Date.now() });
  
  return historicalRate;
}

async function fetchLatestBlueRate(): Promise<BlueRate> {
  const cacheKey = "latest";
  
  const cachedData = memoryCache.get(cacheKey);
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY.LATEST) {
    return cachedData.data;
  }
  
  const response = await fetch(`${API_BASE_URL}/latest`);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json() as LatestAPIResponse;
  const latestRate: BlueRate = {
    value_sell: data.blue.value_sell,
    date: data.last_update,
  };
  
  memoryCache.set(cacheKey, { data: latestRate, timestamp: Date.now() });
  
  return latestRate;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json({ error: "Date parameter is required" }, { status: 400 })
  }

  try {
    let rate: BlueRate;
    
    if (date === "today" || date === new Date().toISOString().split("T")[0]) {
      rate = await fetchLatestBlueRate();
    } else {
      rate = await fetchHistoricalBlueRate(date);
    }
    
    return NextResponse.json({
      date: date,
      base: "USD",
      target: "ARS",
      rate: rate.value_sell,
      source: "Bluelytics API",
    });
    
  } catch (error) {
    console.error("Exchange rate API error:", error);
    return NextResponse.json({ error: "Failed to fetch exchange rate" }, { status: 500 })
  }
}
