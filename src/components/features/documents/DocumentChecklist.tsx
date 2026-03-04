"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Check,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCUMENT_TYPE_LABELS } from "@/types";
import type { DocumentType, DocumentStatus } from "@/types";
import DocumentUpload from "./DocumentUpload";
import { toast } from "sonner";

interface DocumentChecklistProps {
  clientId: string;
}

interface DocumentRecord {
  id: string;
  client_id: string;
  doc_type: DocumentType;
  storage_path: string;
  file_name: string;
  status: DocumentStatus;
  created_at: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  "identity",
  "tax_notice",
  "property_tax",
  "payslips",
  "rib",
  "edf_invoice",
];

function getStatusInfo(docs: DocumentRecord[]) {
  if (docs.length === 0) {
    return { label: "Manquant", color: "bg-red-500", textColor: "text-red-600" };
  }
  const hasVerified = docs.some((d) => d.status === "verified");
  if (hasVerified) {
    return { label: "Fourni", color: "bg-green-500", textColor: "text-green-600" };
  }
  return { label: "À vérifier", color: "bg-orange-500", textColor: "text-orange-600" };
}

export default function DocumentChecklist({ clientId }: DocumentChecklistProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedType, setExpandedType] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error);
      return;
    }

    setDocuments((data as DocumentRecord[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  function getDocumentUrl(storagePath: string) {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("documents")
      .getPublicUrl(storagePath);
    return data.publicUrl;
  }

  async function handleDelete(doc: DocumentRecord) {
    const supabase = createClient();

    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.storage_path]);

    if (storageError) {
      toast.error("Erreur lors de la suppression du fichier");
      return;
    }

    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id);

    if (dbError) {
      toast.error("Erreur lors de la suppression de l'enregistrement");
      return;
    }

    toast.success("Document supprimé");
    fetchDocuments();
  }

  function toggleExpanded(docType: string) {
    setExpandedType((prev) => (prev === docType ? null : docType));
  }

  const providedCount = DOCUMENT_TYPES.filter((type) =>
    documents.some(
      (d) =>
        d.doc_type === type &&
        (d.status === "verified" || d.status === "pending")
    )
  ).length;

  if (loading) {
    return (
      <div className="space-y-3">
        {DOCUMENT_TYPES.map((type) => (
          <div
            key={type}
            className="h-16 animate-pulse rounded-xl border bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progression</span>
        <span className="font-semibold">
          {providedCount}/{DOCUMENT_TYPES.length} documents fournis
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${(providedCount / DOCUMENT_TYPES.length) * 100}%`,
          }}
        />
      </div>

      <div className="space-y-2 pt-2">
        {DOCUMENT_TYPES.map((type) => {
          const typeDocs = documents.filter((d) => d.doc_type === type);
          const status = getStatusInfo(typeDocs);
          const isExpanded = expandedType === type;

          return (
            <Card key={type}>
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => toggleExpanded(type)}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    status.color
                  )}
                >
                  {typeDocs.length === 0 ? (
                    <X className="h-4 w-4 text-white" />
                  ) : typeDocs.some((d) => d.status === "verified") ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {DOCUMENT_TYPE_LABELS[type]}
                  </p>
                  <p className={cn("text-xs", status.textColor)}>
                    {status.label}
                  </p>
                </div>

                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isExpanded && (
                <CardContent className="border-t pt-4">
                  {typeDocs.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {typeDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 rounded-lg border p-2"
                        >
                          <a
                            href={getDocumentUrl(doc.storage_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                          >
                            <img
                              src={getDocumentUrl(doc.storage_path)}
                              alt={doc.file_name}
                              className="h-16 w-16 rounded object-cover"
                            />
                          </a>

                          <div className="flex-1 min-w-0">
                            <p className="truncate text-xs text-muted-foreground">
                              {doc.file_name}
                            </p>
                            <p
                              className={cn(
                                "text-xs font-medium",
                                doc.status === "verified"
                                  ? "text-green-600"
                                  : doc.status === "pending"
                                    ? "text-orange-600"
                                    : "text-red-600"
                              )}
                            >
                              {doc.status === "verified"
                                ? "Vérifié"
                                : doc.status === "pending"
                                  ? "En attente"
                                  : "Rejeté"}
                            </p>
                          </div>

                          <div className="flex shrink-0 gap-1">
                            <a
                              href={getDocumentUrl(doc.storage_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(doc)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <DocumentUpload
                    clientId={clientId}
                    docType={type}
                    onUploadComplete={fetchDocuments}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
