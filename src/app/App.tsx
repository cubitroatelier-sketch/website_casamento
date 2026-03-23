import { useEffect, useState } from "react";

import { AdminLogin } from "@/app/components/AdminLogin";
import { AdminPanel } from "@/app/components/AdminPanel";
import { WeddingRSVP } from "@/app/components/WeddingRSVP";
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  storeAdminToken,
} from "@/app/lib/adminSession";

type ViewType = "rsvp" | "login" | "admin";

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("rsvp");
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = getStoredAdminToken();
    if (storedToken) {
      setAuthToken(storedToken);
      setCurrentView("admin");
    }

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === "A") {
        event.preventDefault();
        setCurrentView(authToken ? "admin" : "login");
      }
    };

    const handleAdminLogin = () => {
      setCurrentView(authToken ? "admin" : "login");
    };

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("openAdminLogin", handleAdminLogin);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener("openAdminLogin", handleAdminLogin);
    };
  }, [authToken]);

  const handleLogin = (token: string) => {
    storeAdminToken(token);
    setAuthToken(token);
    setCurrentView("admin");
  };

  const handleGoHome = () => {
    setCurrentView("rsvp");
  };

  const handleLogout = () => {
    clearStoredAdminToken();
    setAuthToken(null);
    setCurrentView("rsvp");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50">
      {currentView === "rsvp" && <WeddingRSVP />}

      {currentView === "login" && (
        <AdminLogin
          onLogin={handleLogin}
          onBack={() => setCurrentView("rsvp")}
        />
      )}

      {currentView === "admin" && authToken && (
        <AdminPanel
          authToken={authToken}
          onHomeClick={handleGoHome}
          onBackClick={handleLogout}
        />
      )}
    </div>
  );
}
