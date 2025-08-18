// Interfaces de repositórios para desacoplamento total - Schema Mínimo
// Permite trocar localStorage por banco sem alterar serviços

// Importar apenas os tipos básicos que não são definidos localmente
import { Event, Ticket, Sale, Batch, Order, OrderItem, Payment, CheckIn, Coupon } from './index';
import { Database } from '@/lib/supabase';

type User = Database['public']['Tables']['users']['Row'];

export interface IEventsRepository {
  // Operações CRUD básicas
  create(event: CreateEventData): Promise<Event>;
  findById(id: string): Promise<Event | null>;
  findByUrl(url: string): Promise<Event | null>;
  update(id: string, event: Partial<CreateEventData>): Promise<Event>;
  delete(id: string): Promise<DeleteEventResult>;
  
  // Consultas e filtros
  findAll(options?: FindEventsOptions): Promise<EventsResponse>;
  findByUserId(userId: string, options?: FindEventsOptions): Promise<EventsResponse>;
  
  // Estatísticas
  getStats(userId?: string): Promise<EventStats>;
  
  // Operações em lote
  createMany(events: CreateEventData[]): Promise<Event[]>;
  updateMany(updates: Array<{ id: string; data: Partial<CreateEventData> }>): Promise<Event[]>;
  deleteMany(ids: string[]): Promise<void>;
  
  // Novas operações para soft delete
  hasActiveSales(eventId: string): Promise<boolean>;
  archiveEvent(eventId: string, userId: string): Promise<void>;
  reactivateEvent(eventId: string): Promise<void>;
}

export interface ITicketsRepository {
  // Operações básicas
  create(ticket: CreateTicketData): Promise<Ticket>;
  findById(id: string): Promise<Ticket | null>;
  update(id: string, ticket: Partial<CreateTicketData>): Promise<Ticket>;
  delete(id: string): Promise<void>;
  
  // Operações específicas de tickets
  findByEventId(eventId: string): Promise<Ticket[]>;
  updateQuantity(id: string, quantity: number): Promise<Ticket>;
  updateTickets(eventId: string, tickets: Ticket[]): Promise<void>;
  reserveTickets(eventId: string, ticketQuantities: TicketQuantities): Promise<ReservationResult>;
  releaseReservation(reservationId: string): Promise<void>;
  
  // Validações
  checkAvailability(eventId: string, ticketQuantities: TicketQuantities): Promise<AvailabilityCheck>;
}

export interface ISalesRepository {
  // Registro de vendas
  createSale(sale: CreateSaleData): Promise<Sale>;
  findSaleById(id: string): Promise<Sale | null>;
  findSalesByEventId(eventId: string): Promise<Sale[]>;
  findSalesByUserId(userId: string): Promise<Sale[]>;
  
  // Relatórios
  getSalesReport(options: SalesReportOptions): Promise<SalesReport>;
  getRevenueStats(userId?: string): Promise<RevenueStats>;
}

export interface IUserRepository {
  // Operações básicas
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(data: CreateUserData): Promise<User>;
  updateUser(id: string, data: UpdateUserData): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Verificações
  checkEmailExists(email: string): Promise<boolean>;
  
  // Sincronização
  syncUserData(userId: string, userData: {
    email: string;
    full_name?: string;
  }): Promise<User | null>;
}

export interface IBatchesRepository {
  create(batch: Omit<Batch, 'id' | 'createdAt'>): Promise<Batch>;
  findById(id: string): Promise<Batch | null>;
  findByEventId(eventId: string): Promise<Batch[]>;
  update(id: string, batch: Partial<Batch>): Promise<Batch>;
  delete(id: string): Promise<void>;
  updateBatches(eventId: string, batches: Batch[]): Promise<void>;
}

// Tipos de dados para as operações - Schema Mínimo
export interface CreateEventData {
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
  status?: 'draft' | 'published' | 'cancelled';
}

export interface CreateTicketData {
  name: string;
  price: number;
  quantity: number;
  eventId: string;
  available: boolean;
}

export interface CreateSaleData {
  eventId: string;
  userId: string;
  tickets: Array<{
    ticketId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
}

// Opções para consultas
export interface FindEventsOptions {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  location?: string;
  userId?: string;
  includeArchived?: boolean;
  status?: 'draft' | 'published' | 'cancelled';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface EventStats {
  totalEvents: number;
  totalRevenue: number;
  totalTickets: number;
  eventsThisMonth: number;
  revenueThisMonth: number;
}

export interface TicketQuantities {
  [ticketId: string]: number;
}

export interface ReservationResult {
  reservationId: string;
  success: boolean;
  reservedTickets: Array<{
    ticketId: string;
    quantity: number;
    expiresAt: string;
  }>;
  errors?: string[];
}

export interface AvailabilityCheck {
  available: boolean;
  availableTickets: Array<{
    ticketId: string;
    availableQuantity: number;
    requestedQuantity: number;
  }>;
  errors?: string[];
}

export interface SalesReportOptions {
  dateFrom: string;
  dateTo: string;
  eventId?: string;
  userId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'event';
}

export interface SalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  totalTickets: number;
  breakdown: Array<{
    period: string;
    sales: number;
    revenue: number;
    tickets: number;
  }>;
}

export interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  averageTicketPrice: number;
  topPerformingEvents: Array<{
    eventId: string;
    title: string;
    revenue: number;
    ticketsSold: number;
  }>;
}

// Tipos para usuários - Schema Mínimo
export interface CreateUserData {
  id: string;
  email: string;
  full_name?: string;
}

export interface UpdateUserData {
  email?: string;
  full_name?: string;
}

// Tipos para operações de exclusão
export interface DeleteEventResult {
  success: boolean;
  action: 'deleted' | 'archived';
  message: string;
  hasSales: boolean;
}

// Interfaces para Orders - Schema Mínimo
export interface CreateOrderData {
  userId: string;
  subtotal: number; // Valor dos ingressos (para o produtor)
  serviceFee?: number; // Taxa de serviço (plataforma)
  total: number; // Total com taxa (para cobrança)
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
}

export interface UpdateOrderData {
  subtotal?: number;
  serviceFee?: number;
  total?: number;
  status?: 'pending' | 'paid' | 'failed' | 'cancelled';
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  paidAt?: string;
}

export interface IOrdersRepository {
  create(order: CreateOrderData): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  update(id: string, order: UpdateOrderData): Promise<Order>;
  delete(id: string): Promise<void>;
}

// Interfaces para Order Items - NOVO
export interface CreateOrderItemData {
  orderId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrderItemsRepository {
  create(orderItem: CreateOrderItemData): Promise<OrderItem>;
  findById(id: string): Promise<OrderItem | null>;
  findByOrderId(orderId: string): Promise<OrderItem[]>;
  findByBatchId(batchId: string): Promise<OrderItem[]>;
  update(id: string, orderItem: Partial<OrderItem>): Promise<OrderItem>;
  delete(id: string): Promise<void>;
}

// Interfaces para Payments - Schema Mínimo
export interface CreatePaymentData {
  orderId: string;
  provider: string;
  providerPaymentId: string;
  status: string;
  amount: number;
}

export interface IPaymentsRepository {
  create(payment: CreatePaymentData): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  update(id: string, payment: Partial<Payment>): Promise<Payment>;
  delete(id: string): Promise<void>;
}

// Interfaces para Check-ins - Schema Mínimo
export interface CreateCheckInData {
  ticketId: string;
  checkedByUserId?: string;
}

export interface ICheckInsRepository {
  create(checkIn: CreateCheckInData): Promise<CheckIn>;
  findById(id: string): Promise<CheckIn | null>;
  findByTicketId(ticketId: string): Promise<CheckIn[]>;
  update(id: string, checkIn: Partial<CheckIn>): Promise<CheckIn>;
  delete(id: string): Promise<void>;
}

// Interfaces para Coupons - Schema Mínimo
export interface CreateCouponData {
  code: string;
  eventId?: string;
  discountType?: 'percent' | 'fixed';
  discountValue: number;
  maxUses?: number;
  expiresAt?: string;
}

export interface ICouponsRepository {
  create(coupon: CreateCouponData): Promise<Coupon>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findByEventId(eventId: string): Promise<Coupon[]>;
  update(id: string, coupon: Partial<Coupon>): Promise<Coupon>;
  delete(id: string): Promise<void>;
}

// Interfaces para Tickets - Schema Mínimo
export interface TicketEntity {
  id: string;
  batchId: string;
  orderId?: string;
  ticketNumber: string;
  status: 'available' | 'sold' | 'used' | 'cancelled';
  qrCode?: string;
  holderName?: string;
  holderEmail?: string;
  createdAt?: string;
}

export interface CreateTicketData {
  batchId: string;
  orderId?: string;
  ticketNumber: string;
  status?: 'available' | 'sold' | 'used' | 'cancelled';
  qrCode?: string;
  holderName?: string;
  holderEmail?: string;
}

export interface ITicketsRepository {
  create(ticket: CreateTicketData): Promise<TicketEntity>;
  findById(id: string): Promise<TicketEntity | null>;
  findByBatchId(batchId: string): Promise<TicketEntity[]>;
  findByOrderId(orderId: string): Promise<TicketEntity[]>;
  update(id: string, ticket: Partial<TicketEntity>): Promise<TicketEntity>;
  delete(id: string): Promise<void>;
  reserveTickets(batchId: string, quantity: number, userId: string | null): Promise<TicketEntity[]>;
  assignTicketsToOrder(ticketIds: string[], orderId: string): Promise<void>;
}
