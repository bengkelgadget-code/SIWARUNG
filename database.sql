-- Buat tabel produk
CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  stock NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  description TEXT,
  image TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat tabel riwayat penjualan (kasir)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL,
  payment NUMERIC NOT NULL,
  change NUMERIC NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat tabel riwayat belanja (nota restok)
CREATE TABLE purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "invoiceNo" TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  "totalCost" NUMERIC NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fungsi trigger untuk otomatis memperbarui kolom updatedAt di products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Buat tabel pengaturan aplikasi
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  "geminiApiKey" TEXT
);

-- Masukkan baris awal
INSERT INTO settings (id, "geminiApiKey") VALUES ('global', '');

