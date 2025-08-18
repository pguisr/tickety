// Serviço para gerenciamento de reservas de ingressos - Schema Mínimo
// NOTA: No schema mínimo, não há mais sistema de reservas temporárias
// Os tickets são reservados diretamente durante o checkout

import { supabase } from '@/lib/supabase';

export interface ReservationStatus {
  totalReservations: number;
  expiredReservations: number;
  activeReservations: number;
}

export class ReservationService {
  private static readonly RESERVATION_TIMEOUT = 15 * 60 * 1000; // 15 minutos em millisegundos

  /**
   * Limpa reservas expiradas automaticamente
   * NOTA: No schema mínimo, não há mais reservas temporárias
   */
  static async cleanExpiredReservations(): Promise<{ cleaned: number; errors: string[] }> {
    // No schema mínimo, não há mais sistema de reservas temporárias
    // Os tickets são reservados diretamente durante o checkout
    console.log('Limpeza automática: Sistema de reservas temporárias não disponível no schema mínimo');
    return { cleaned: 0, errors: [] };
  }

  /**
   * Obtém estatísticas das reservas
   * NOTA: No schema mínimo, não há mais reservas temporárias
   */
  static async getReservationStatus(): Promise<ReservationStatus> {
    // No schema mínimo, não há mais sistema de reservas temporárias
    return { totalReservations: 0, expiredReservations: 0, activeReservations: 0 };
  }

  /**
   * Reserva ingressos temporariamente
   * NOTA: No schema mínimo, os tickets são reservados diretamente durante o checkout
   */
  static async reserveTickets(
    batchId: string, 
    quantity: number, 
    userId: string
  ): Promise<{ success: boolean; reservedTickets?: string[]; error?: string }> {
    try {
      // Verificar disponibilidade
      const { data: availableTickets, error: availabilityError } = await supabase
        .from('tickets')
        .select('id')
        .eq('batch_id', batchId)
        .eq('status', 'available')
        .limit(quantity);

      if (availabilityError) {
        return { success: false, error: `Erro ao verificar disponibilidade: ${availabilityError.message}` };
      }

      if (!availableTickets || availableTickets.length < quantity) {
        return { success: false, error: 'Quantidade insuficiente de ingressos disponíveis' };
      }

      // No schema mínimo, não há mais reservas temporárias
      // Os tickets são reservados diretamente durante o checkout
      const ticketIds = availableTickets.map(ticket => ticket.id);
      
      return { 
        success: true, 
        reservedTickets: ticketIds 
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      };
    }
  }

  /**
   * Libera reservas de um usuário
   * NOTA: No schema mínimo, não há mais reservas temporárias
   */
  static async releaseUserReservations(userId: string): Promise<{ released: number; error?: string }> {
    // No schema mínimo, não há mais sistema de reservas temporárias
    console.log('Liberação de reservas: Sistema de reservas temporárias não disponível no schema mínimo');
    return { released: 0 };
  }

  /**
   * Agenda limpeza automática (para ser chamada periodicamente)
   * NOTA: No schema mínimo, não há mais limpeza automática necessária
   */
  static scheduleCleanup(): void {
    // No schema mínimo, não há mais sistema de reservas temporárias
    // A limpeza automática não é mais necessária
    console.log('Agendamento de limpeza: Sistema de reservas temporárias não disponível no schema mínimo');
  }
}
