"use client";

import { Button } from "@workspace/ui/components/button";
import { FileDown } from "lucide-react";
import { useAuth } from "@/app/providers/auth-provider";

export default function ProcessingHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const handleExport = () => {
    console.log("Export data clicked");
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Processing Dashboard
        </h1>
        <p className="text-gray-600">Manage and track crop processing</p>
      </div>

      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-9 bg-purple-500 text-white hover:bg-purple-600 hover:text-white"
        >
          <FileDown className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      )}
    </div>
  );
}
