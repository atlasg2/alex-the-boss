import { apiRequest } from "./queryClient";

// Admin auth utilities
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

// CLIENT PORTAL AUTHENTICATION
export const portalLogin = async (email: string, password: string) => {
  try {
    const response = await apiRequest("POST", "/api/portal/login", { email, password });
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Portal login error:", error);
    return { success: false, error };
  }
};

export const portalLogout = async () => {
  try {
    await apiRequest("POST", "/api/portal/logout", {});
    return { success: true };
  } catch (error) {
    console.error("Portal logout error:", error);
    return { success: false, error };
  }
};

export const getCurrentPortalUser = async () => {
  try {
    const response = await apiRequest("GET", "/api/portal/me", undefined);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get current portal user error:", error);
    return { success: false, error: error };
  }
};

// Generate portal credentials for a client
export const generatePortalAccess = async (contactId: string) => {
  try {
    // Generate a random password
    const randomPassword = Math.random().toString(36).slice(-8);
    
    const response = await apiRequest("POST", "/api/portal/enable", {
      contactId,
      password: randomPassword
    });
    
    const data = await response.json();
    return { 
      success: true, 
      contactId: data.id || contactId,
      email: data.email || "",
      password: randomPassword,
      portalUrl: `/portal/login` 
    };
  } catch (error) {
    console.error("Generate portal access error:", error);
    return { success: false, error };
  }
};

// Generate a temporary portal token for a job
export const generatePortalToken = async (jobId: string) => {
  try {
    const response = await apiRequest("POST", "/api/portal/tokens", { 
      jobId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    const token = await response.json();
    return { 
      success: true, 
      token: token.token,
      portalUrl: `/portal/${token.token}` 
    };
  } catch (error) {
    console.error("Generate portal token error:", error);
    return { success: false, error };
  }
};

// Legacy token verification - will gradually phase out
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
