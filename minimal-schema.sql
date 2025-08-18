-- Schema REALMENTE mínimo para MVP Tickety
-- Execute este script no SQL Editor do Supabase

-- =============================================
-- 0. CONFIGURAR TIMEZONE PARA GMT-3 (BRASÍLIA)
-- =============================================
-- Configurar timezone para GMT-3 (horário de Brasília)
SET timezone = 'America/Sao_Paulo';

-- =============================================
-- 1. LIMPAR SCHEMA ATUAL (CUIDADO!)
-- =============================================
-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.check_ins DISABLE ROW LEVEL SECURITY;

-- Remover tabelas não utilizadas
DROP TABLE IF EXISTS public.order_buyer_snapshots CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.ticket_status_history CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.event_sessions CASCADE;
DROP TABLE IF EXISTS public.event_instances CASCADE;
DROP TABLE IF EXISTS public.coupon_redemptions CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;

-- =============================================
-- 2. RECRIAR TABELAS ESSENCIAIS COM TIMEZONE
-- =============================================

-- Usuários (simplificado)
DROP TABLE IF EXISTS public.users CASCADE;
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Eventos (simplificado)
DROP TABLE IF EXISTS public.events CASCADE;
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  description text,
  location varchar NOT NULL,
  address text NOT NULL,
  url varchar UNIQUE NOT NULL,
  image_url text,
  max_capacity integer DEFAULT 0,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  user_id uuid NOT NULL, -- organizador
  status varchar DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled')),
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Lotes de ingressos (simplificado)
DROP TABLE IF EXISTS public.batches CASCADE;
CREATE TABLE public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title varchar NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  quantity integer NOT NULL CHECK (quantity >= 0),
  is_active boolean DEFAULT true,
  sale_starts_at timestamp with time zone,
  sale_ends_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Pedidos (simplificado)
DROP TABLE IF EXISTS public.orders CASCADE;
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subtotal numeric NOT NULL CHECK (subtotal >= 0), -- Valor dos ingressos (para o produtor)
  service_fee numeric NOT NULL DEFAULT 5 CHECK (service_fee >= 0), -- Taxa de serviço (plataforma)
  total numeric NOT NULL CHECK (total >= 0), -- Total com taxa (para cobrança)
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'expired')),
  buyer_name varchar NOT NULL,
  buyer_email varchar NOT NULL,
  buyer_phone varchar,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'),
  paid_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Itens do pedido (NOVA - essencial para relatórios)
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES batches(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Ingressos (simplificado)
DROP TABLE IF EXISTS public.tickets CASCADE;
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id),
  ticket_number varchar UNIQUE NOT NULL,
  status varchar DEFAULT 'available' CHECK (status IN ('available', 'sold', 'used', 'cancelled')),
  qr_code text UNIQUE,
  holder_name text,
  holder_email text,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Pagamentos (simplificado)
DROP TABLE IF EXISTS public.payments CASCADE;
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_payment_id text NOT NULL,
  status text DEFAULT 'pending',
  amount numeric NOT NULL CHECK (amount >= 0),
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- Check-ins (simplificado)
DROP TABLE IF EXISTS public.check_ins CASCADE;
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id),
  checked_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'),
  checked_by_user_id uuid REFERENCES users(id)
);

-- Cupons (OPCIONAL - só se precisar)
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  discount_type text CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL CHECK (discount_value >= 0),
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo')
);

-- =============================================
-- 3. ÍNDICES ESSENCIAIS
-- =============================================

-- Usuários
CREATE INDEX idx_users_email ON public.users(email);

-- Eventos
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_starts_at ON public.events(starts_at);
CREATE INDEX idx_events_url ON public.events(url);

-- Lotes
CREATE INDEX idx_batches_event_id ON public.batches(event_id);
CREATE INDEX idx_batches_sale_dates ON public.batches(sale_starts_at, sale_ends_at);

-- Pedidos
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Itens do pedido
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_batch_id ON public.order_items(batch_id);

-- Ingressos
CREATE INDEX idx_tickets_batch_id ON public.tickets(batch_id);
CREATE INDEX idx_tickets_order_id ON public.tickets(order_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_tickets_number ON public.tickets(ticket_number);
CREATE INDEX idx_tickets_qr_code ON public.tickets(qr_code);

-- Pagamentos
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Check-ins
CREATE INDEX idx_check_ins_ticket_id ON public.check_ins(ticket_id);
CREATE INDEX idx_check_ins_checked_at ON public.check_ins(checked_at);

-- Cupons
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_event_id ON public.coupons(event_id);

-- =============================================
-- 4. RLS SIMPLIFICADO
-- =============================================

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas simples
CREATE POLICY "Users can manage own data" ON public.users FOR ALL USING (auth.uid() = id);

CREATE POLICY "Everyone can view published events" ON public.events FOR SELECT USING (status = 'published');
CREATE POLICY "Users can manage own events" ON public.events FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view batches for published events" ON public.batches FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = batches.event_id AND events.status = 'published')
);
CREATE POLICY "Event organizers can manage batches" ON public.batches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = batches.event_id AND events.user_id = auth.uid())
);

CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "System can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can view available tickets" ON public.tickets FOR SELECT USING (status = 'available');
CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = tickets.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "System can manage tickets" ON public.tickets FOR ALL USING (true);

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = payments.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "System can create payments" ON public.payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Event organizers can view check-ins" ON public.check_ins FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    JOIN public.batches ON batches.id = tickets.batch_id
    JOIN public.events ON events.id = batches.event_id
    WHERE tickets.id = check_ins.ticket_id AND events.user_id = auth.uid()
  )
);
CREATE POLICY "Authorized users can create check-ins" ON public.check_ins FOR INSERT WITH CHECK (auth.uid() = checked_by_user_id);

CREATE POLICY "Everyone can view active coupons" ON public.coupons FOR SELECT USING (
  (expires_at IS NULL OR expires_at > now()) AND (max_uses IS NULL OR current_uses < max_uses)
);
CREATE POLICY "Event organizers can manage coupons" ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.events WHERE events.id = coupons.event_id AND events.user_id = auth.uid())
);

-- =============================================
-- 5. FUNÇÕES ESSENCIAIS
-- =============================================

-- Função para criar usuário automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para gerar QR code único
CREATE OR REPLACE FUNCTION public.generate_ticket_qr_code()
RETURNS text AS $$
BEGIN
  RETURN 'TKT-' || gen_random_uuid()::text;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. VERIFICAÇÃO FINAL
-- =============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
