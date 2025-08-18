// Tipos centralizados para o projeto MVP Ticket - Schema Mínimo

// Tipos de Lote (Batch) - Schema Mínimo
export interface Batch {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  isActive?: boolean;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
  createdAt?: string;
}

// Tipos de Ingresso
export interface Ticket {
  id: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
}

// Tipos de Evento - Schema Mínimo
export interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  address: string;
  url: string;
  imageUrl?: string;
  maxCapacity?: number;
  startsAt: string;
  endsAt: string;
  userId: string;
  status: 'draft' | 'published' | 'cancelled';
  createdAt?: string;
  batches?: Batch[];
}

// Tipos de Usuário - Schema Mínimo
export interface UserData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Tipos de Formulário de Evento
export interface EventFormData {
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  address: string;
  url: string;
  image: string;
  tickets: Ticket[];
  batches: Batch[];
}

// Tipos de Quantidade de Ingressos
export interface TicketQuantities {
  [key: string]: number;
}

// Novos tipos para o sistema de vendas
export interface Sale {
  id: string;
  eventId: string;
  userId: string;
  tickets: Array<{
    ticketId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// Tipos para reservas de ingressos
export interface TicketReservation {
  id: string;
  eventId: string;
  userId: string;
  tickets: Array<{
    ticketId: string;
    quantity: number;
  }>;
  expiresAt: string;
  status: 'active' | 'expired' | 'converted';
  createdAt: string;
}

// Tipos de Checkout - Schema Mínimo
export interface CheckoutData {
  fullName: string;
  email: string;
  phone: string;
  paymentMethod: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolder?: string;
  ticketData: TicketData[];
}

// Dados específicos de cada ingresso - Schema Mínimo
export interface TicketData {
  id: string; // ID único do ingresso
  batchId: string; // ID do lote
  attendeeName: string; // Nome do participante
  attendeeEmail?: string; // Email do participante (opcional)
  attendeePhone?: string; // Telefone do participante (opcional)
}

// Tipos para operações de exclusão
export interface DeleteEventResult {
  success: boolean;
  action: 'deleted' | 'archived';
  message: string;
  hasSales: boolean;
}

// Tipos para Order Items - NOVO
export interface OrderItem {
  id: string;
  orderId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  createdAt: string;
}

// Tipos para Orders - Schema Mínimo
export interface Order {
  id: string;
  userId: string;
  subtotal: number; // Valor dos ingressos (para o produtor)
  serviceFee: number; // Taxa de serviço (plataforma)
  total: number; // Total com taxa (para cobrança)
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  createdAt: string;
  paidAt?: string;
}

// Tipos para Payments - Schema Mínimo
export interface Payment {
  id: string;
  orderId: string;
  provider: string;
  providerPaymentId: string;
  status: string;
  amount: number;
  createdAt: string;
}

// Tipos para Check-ins - Schema Mínimo
export interface CheckIn {
  id: string;
  ticketId: string;
  checkedAt: string;
  checkedByUserId?: string;
}

// Tipos para Coupons - Schema Mínimo
export interface Coupon {
  id: string;
  code: string;
  eventId?: string;
  discountType?: 'percent' | 'fixed';
  discountValue: number;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  createdAt: string;
}

// Exportar interfaces de repositórios
export * from './repositories';
