"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FolderOpen, Loader2 } from "lucide-react";
import { useSimulationBasePath } from "@/hooks/use-simulation-paths";
import DocumentChecklist from "@/components/features/documents/DocumentChecklist";

export default function SimulationDocumentsPage() {
  const params = useParams();
  const id = params.id as string;
  const basePath = useSimulationBasePath();

  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimulation() {
      const supabase = createClient();
      const { data } = await supabase
        .from("simulations")
        .select("client_id, client:clients(first_name, last_name)")
        .eq("id", id)
        .single();

      if (data) {
        setClientId(data.client_id);
        const client = data.client as unknown as {
          first_name: string;
          last_name: string;
        } | null;
        if (client) {
          setClientName(`${client.first_name} ${client.last_name}`);
        }
      }

      setLoading(false);
    }

    fetchSimulation();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="space-y-4 p-4">
        <Link href={`${basePath}/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Simulation introuvable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3">
        <Link href={`${basePath}/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Documents</h1>
          {clientName && (
            <p className="text-sm text-muted-foreground">{clientName}</p>
          )}
        </div>
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>

      <DocumentChecklist clientId={clientId} />
    </div>
  );
}
