"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadProps {
  clientId: string;
  docType: string;
  onUploadComplete: () => void;
}

async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.7
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function DocumentUpload({
  clientId,
  docType,
  onUploadComplete,
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function clearSelection() {
    setSelectedFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const compressed = await compressImage(selectedFile);
      const timestamp = Date.now();
      const storagePath = `${clientId}/${docType}_${timestamp}.jpg`;
      const supabase = createClient();

      const { error: storageError } = await supabase.storage
        .from("documents")
        .upload(storagePath, compressed, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (storageError) throw storageError;

      const { error: dbError } = await supabase.from("documents").insert({
        client_id: clientId,
        doc_type: docType as "identity" | "tax_notice" | "property_tax" | "payslips" | "rib" | "edf_invoice",
        storage_path: storagePath,
        file_name: `${docType}_${timestamp}.jpg`,
        status: "pending" as const,
      });

      if (dbError) throw dbError;

      toast.success("Document téléversé avec succès");
      clearSelection();
      onUploadComplete();
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Erreur lors du téléversement du document");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Prendre une photo / Choisir un fichier
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-lg border">
            <img
              src={preview}
              alt="Aperçu du document"
              className="h-48 w-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-7 w-7"
              onClick={clearSelection}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Envoyer le document
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
