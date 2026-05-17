import React from "react";
import CommandPalette from "./CommandPalette";
import EditorialAssistant from "./EditorialAssistant";
import { useLocation } from "react-router-dom";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isWelcome = location.pathname === "/welcome";

  if (isWelcome) return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      <CommandPalette />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
        <EditorialAssistant />
      </div>
    </div>
  );
}
