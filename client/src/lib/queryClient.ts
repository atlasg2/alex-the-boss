import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  
  try {
    const cleanedData = data ? cleanupUndefinedValues(data) : undefined;
    console.log(`Cleaned data for ${method} ${url}:`, cleanedData);
    
    const res = await fetch(url, {
      method,
      headers: cleanedData ? { "Content-Type": "application/json" } : {},
      body: cleanedData ? JSON.stringify(cleanedData) : undefined,
      credentials: "include",
    });
    
    console.log(`API Response for ${method} ${url}:`, { 
      status: res.status, 
      statusText: res.statusText
    });
    
    // We don't throw here anymore - let the caller decide what to do with non-OK responses
    // This allows mutation handlers to extract error messages from JSON responses
    if (!res.ok) {
      // Try to parse as JSON first, fall back to text
      try {
        const errorData = await res.clone().json();
        console.error(`API Error for ${method} ${url}:`, { 
          status: res.status, 
          data: errorData 
        });
      } catch (e) {
        const text = await res.clone().text();
        console.error(`API Error for ${method} ${url}:`, { 
          status: res.status, 
          text: text || res.statusText 
        });
      }
    }
    
    return res;
  } catch (error) {
    console.error(`API Request Failed for ${method} ${url}:`, error);
    throw error;
  }
}

// Helper function to remove undefined values from API request data
function cleanupUndefinedValues(obj: any): any {
  // For arrays, filter out undefined values
  if (Array.isArray(obj)) {
    return obj.map(cleanupUndefinedValues).filter(item => item !== undefined);
  }
  
  // For objects, recursively clean up properties
  if (obj && typeof obj === 'object') {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values entirely
      if (value === undefined) continue;
      
      // Handle null values
      if (value === null) {
        result[key] = null;
        continue;
      }
      
      // Recursively clean objects and arrays
      if (typeof value === 'object') {
        result[key] = cleanupUndefinedValues(value);
        continue;
      }
      
      // Keep primitives as is
      result[key] = value;
    }
    
    return result;
  }
  
  // Return primitives as is
  return obj;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Quote-specific API functions
export const quoteApi = {
  getQuote: async (quoteId: string) => {
    const response = await apiRequest("GET", `/api/quotes/${quoteId}`, undefined);
    if (!response.ok) {
      throw new Error("Failed to fetch quote");
    }
    return response.json();
  },
  
  getQuoteItems: async (quoteId: string) => {
    const response = await apiRequest("GET", `/api/quotes/${quoteId}/items`, undefined);
    if (!response.ok) {
      throw new Error("Failed to fetch quote items");
    }
    return response.json();
  },
  
  getQuotePdf: async (quoteId: string) => {
    // This will return a PDF blob
    const response = await fetch(`/api/quotes/${quoteId}/pdf?format=pdf`);
    if (!response.ok) {
      throw new Error("Failed to generate PDF");
    }
    return response.blob();
  },
  
  sendQuote: async (quoteId: string) => {
    const response = await apiRequest("POST", `/api/quotes/${quoteId}/send`, {});
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to send quote");
    }
    return response.json();
  },
  
  approveQuote: async (quoteId: string, signature: string, customerName?: string, notes?: string) => {
    const response = await apiRequest("POST", `/api/quotes/${quoteId}/approve`, {
      signature,
      date: new Date().toISOString(),
      customerName,
      notes
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to approve quote");
    }
    return response.json();
  }
};
