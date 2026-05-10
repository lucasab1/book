import React from "react";
import CommandPalette from "./CommandPalette";
import EditorialAssistant from "./EditorialAssistant";
import { useLocation } from "react-router-dom";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isWelcome = location.pathname === "/welcome";

  if (isWelcome) return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors duration-500">
      <CommandPalette />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {children}
        </div>
        <EditorialAssistant />
      </div>
    </div>
  );
}
