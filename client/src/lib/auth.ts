import { apiRequest } from "./queryClient";

// Simple auth utilities (placeholder for Supabase in future)
export const login = async (username: string, password: string) => {
  try {
    const response = await apiRequest("POST", "/api/login", { username, password });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error };
  }
};

export const logout = async () => {
  try {
    await apiRequest("POST", "/api/logout", {});
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error };
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiRequest("GET", "/api/me", undefined);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get current user error:", error);
    return { success: false, error };
  }
};

// Placeholder to generate a portal token for a job
export const generatePortalToken = async (jobId: string) => {
  try {
    const token = `job-${jobId}-${Date.now()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    const response = await apiRequest("POST", "/api/portal/tokens", {
      jobId,
      token,
      expiresAt: expiresAt.toISOString()
    });
    
    const data = await response.json();
    return { success: true, token: data.token, portalUrl: `/portal/${data.token}` };
  } catch (error) {
    console.error("Generate portal token error:", error);
    return { success: false, error };
  }
};

// Verify a portal token
export const verifyPortalToken = async (token: string) => {
  try {
    const response = await apiRequest("GET", `/api/portal/${token}`, undefined);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Verify portal token error:", error);
    return { success: false, error };
  }
};
