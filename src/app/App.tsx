import { useState, useEffect } from "react";
import { WeddingRSVP } from "@/app/components/WeddingRSVP";
import { AdminPanel } from "@/app/components/AdminPanel";
import { AdminLogin } from "@/app/components/AdminLogin";

type ViewType = "rsvp" | "login" | "admin";

function getStoredAdminAuth() {
  try {
    return window.sessionStorage.getItem("adminAuth") === "true";
  } catch {
    return false;
  }
}

function setStoredAdminAuth() {
  try {
    window.sessionStorage.setItem("adminAuth", "true");
  } catch {
    // Safari/WebKit can block sessionStorage in private/restricted modes.
  }
}

function clearStoredAdminAuth() {
  try {
    window.sessionStorage.removeItem("adminAuth");
  } catch {
    // Ignore storage cleanup failures; local state still logs the user out.
  }
}

export default function App() {
  const [currentView, setCurrentView] =
    useState<ViewType>("rsvp");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se já está autenticado
    if (getStoredAdminAuth()) {
      setIsAuthenticated(true);
    }

    // Listener para atalho de teclado (Ctrl+Shift+A)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setCurrentView("login");
      }
    };

    // Listener para evento customizado do botão admin
    const handleAdminLogin = () => {
      setCurrentView("login");
    };

    window.addEventListener("keydown", handleKeyPress);
    window.addEventListener("openAdminLogin", handleAdminLogin);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
      window.removeEventListener(
        "openAdminLogin",
        handleAdminLogin,
      );
    };
  }, []);

  const handleLogin = () => {
    setStoredAdminAuth();
    setIsAuthenticated(true);
    setCurrentView("admin");
  };

  const handleLogout = () => {
    clearStoredAdminAuth();
    setIsAuthenticated(false);
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

      {currentView === "admin" && isAuthenticated && (
        <AdminPanel onBackClick={handleLogout} />
      )}
    </div>
  );
}