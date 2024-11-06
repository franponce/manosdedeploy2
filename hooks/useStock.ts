import useSWR from 'swr'
import { useState, useCallback } from 'react'

interface StockResponse {
  stock: number;
  lastUpdate: string;
}

export function useStock(productId: string | undefined) {
  const [pollingInterval, setPollingInterval] = useState(5000)

  const fetcher = useCallback(async (url: string) => {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Error al obtener el stock')
    }
    return response.json()
  }, [])

  const { data, error, mutate } = useSWR<StockResponse>(
    productId ? `/api/products/${productId}/stock` : null,
    fetcher,
    {
      refreshInterval: pollingInterval,
      dedupingInterval: 2000,
      revalidateOnFocus: true,
      onError: () => setPollingInterval(15000),
      onSuccess: () => setPollingInterval(5000)
    }
  )

  return {
    stock: data?.stock ?? 0,
    lastUpdate: data?.lastUpdate,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
} 