-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('devis', 'devis', false);

-- Storage policies for documents bucket
CREATE POLICY "Users upload documents for their clients"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users view documents for their clients"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins manage all documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'documents'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage policies for devis bucket
CREATE POLICY "Users view devis PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'devis'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "System uploads devis PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'devis'
    AND auth.uid() IS NOT NULL
  );
