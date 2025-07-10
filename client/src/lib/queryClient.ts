import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Buat custom error dengan properti response
    const error: any = new Error(`${res.status}: ${res.statusText}`);
    error.response = res.clone(); // Clone response agar bisa dibaca lagi nanti
    
    // Coba parse response body untuk debugging
    try {
      const errorData = await res.json();
      console.log('Error response body:', errorData);
      error.data = errorData;
      
      // Tambahkan pesan error yang lebih deskriptif
      if (errorData.message) {
        error.message = errorData.message;
        
        // Jika ada detail validasi, tambahkan ke pesan error
        if (errorData.details) {
          if (Array.isArray(errorData.details)) {
            const detailMessages = errorData.details
              .map((detail: any) => {
                if (detail.message) return detail.message;
                if (detail.path && detail.message) return `${detail.path.join('.')}: ${detail.message}`;
                return detail.toString();
              })
              .join(', ');
            error.detailMessage = detailMessages;
          } else {
            error.detailMessage = errorData.details.toString();
          }
        }
      }
    } catch (e) {
      console.log('Could not parse error response body');
    }
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

export async function apiFileUpload(
  method: string,
  url: string,
  file: File,
  fieldName: string = 'file'
): Promise<Response> {
  console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
  console.log(`Using field name: ${fieldName}`);
  
  const formData = new FormData();
  formData.append(fieldName, file);
  
  // Log the full URL being used
  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
  console.log(`Full upload URL: ${fullUrl}`);
  console.log(`Sending ${method} request to ${url}`);
  
  try {
    const res = await fetch(url, {
      method,
      body: formData,
      credentials: "include",
      // Don't set Content-Type header, browser will set it with boundary for FormData
    });

    console.log(`Upload response status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Upload failed with status ${res.status}: ${errorText}`);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    console.log('Upload successful');
    return res;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
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
