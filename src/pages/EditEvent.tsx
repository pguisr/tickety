import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, X, Plus, Minus, Upload, Image as ImageIcon, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast as sonnerToast } from 'sonner';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { EventFormData, Batch } from '@/types';
import PageTransition from '@/components/PageTransition';
// Constantes locais
const EVENT_TIPS = {
  TITLE: "Dica",
  IMAGE_RESOLUTION: "A imagem de capa deve ter 1200x630px"
} as const;
import { SupabaseEventsRepository, SupabaseBatchesRepository } from '@/repositories/SupabaseRepository';
import { DateTimeInput } from '@/components/ui/datetime-input';
import EventTicketsSection from '@/components/EventTicketsSection';
import EventImageSection from '@/components/EventImageSection';
import EventTipsSection from '@/components/EventTipsSection';
import EventActionButtons from '@/components/EventActionButtons';

const EditEvent: React.FC = () => {
  const navigate = useNavigate();
  const { url } = useParams();
  const { user } = useAuth();
  const [repository] = useState(() => new SupabaseEventsRepository());
  const [batchesRepository] = useState(() => new SupabaseBatchesRepository());

  // Estado do formulário
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    address: '',
    url: '',
    image: '',
    tickets: [],
    batches: []
  });

  // Estado inicial para comparação
  const [initialFormData, setInitialFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startsAt: '',
    endsAt: '',
    location: '',
    address: '',
    url: '',
    image: '',
    tickets: [],
    batches: []
  });

  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [initialFormData, setInitialFormData] = useState<EventFormData | null>(null); // This line is removed

  // Verifica se houve mudanças no formulário
  const hasChanges = () => {
    if (!initialFormData) return false;
    
    // Compara campos básicos
    const basicFieldsChanged = 
      formData.title !== initialFormData.title ||
      formData.description !== initialFormData.description ||
      formData.startsAt !== initialFormData.startsAt ||
      formData.endsAt !== initialFormData.endsAt ||
      formData.location !== initialFormData.location ||
      formData.address !== initialFormData.address ||
      formData.url !== initialFormData.url ||
      formData.image !== initialFormData.image;

    // Compara tickets
    const ticketsChanged = formData.tickets.length !== initialFormData.tickets.length ||
      formData.tickets.some((ticket, index) => {
        const initialTicket = initialFormData.tickets[index];
        if (!initialTicket) return true;
        return ticket.name !== initialTicket.name ||
               ticket.price !== initialTicket.price ||
               ticket.quantity !== initialTicket.quantity ||
               ticket.available !== initialTicket.available;
      });

    // Compara batches (ADICIONADO)
    const batchesChanged = formData.batches.length !== initialFormData.batches.length ||
      formData.batches.some((batch, index) => {
        const initialBatch = initialFormData.batches[index];
        if (!initialBatch) return true;
        return batch.title !== initialBatch.title ||
               batch.quantity !== initialBatch.quantity ||
               batch.price !== initialBatch.price ||
               batch.isActive !== initialBatch.isActive ||
               batch.startDate !== initialBatch.startDate ||
               batch.endDate !== initialBatch.endDate;
      });

    return basicFieldsChanged || ticketsChanged || batchesChanged;
  };

  // Função para converter timestamp para formato datetime-local
  const formatTimestampForInput = (timestamp: string): string => {
    if (!timestamp) return '';
    
    try {
      // Extrair data e hora diretamente do timestamp preservando o horário original
      const match = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
      if (!match) {
        // Fallback para o método anterior se o regex não funcionar
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
          return '';
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      const [, year, month, day, hours, minutes] = match;
      
      // Retornar no formato datetime-local preservando o horário original
      const result = `${year}-${month}-${day}T${hours}:${minutes}`;
      
      console.log('Conversão para input:', {
        original: timestamp,
        extracted: { year, month, day, hours, minutes },
        result: result
      });
      
      return result;
    } catch (error) {
      return '';
    }
  };

  // Carrega os dados do evento
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    const loadEvent = async () => {
      if (!url) return;
      
      try {
        setLoading(true);
        const event = await repository.findByUrl(url);
        
        if (event) {
          // Verifica se o usuário é o dono do evento
          if (event.userId !== user?.id) {
            sonnerToast.error('Você não pode editar este evento.');
            navigate('/');
            return;
          }

          const eventData: EventFormData = {
            title: event.title,
            description: event.description,
            startsAt: formatTimestampForInput(event.startsAt),
            endsAt: event.endsAt ? formatTimestampForInput(event.endsAt) : '',
            location: event.location,
            address: event.address,
            url: event.url,
            image: event.image,
            tickets: event.tickets || [],
            batches: event.batches || []
          };
          
          setFormData(eventData);
          setImagePreview(event.image);
          setInitialFormData(eventData); // Define como inicial
        } else {
          sonnerToast.error('Evento não encontrado.');
          navigate('/');
        }
      } catch (error) {
        console.error('Erro ao carregar evento:', error);
        sonnerToast.error('Não foi possível carregar o evento. Tente novamente.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    loadEvent();
  }, [url, navigate, repository, user?.id]);

  // Atualiza campos do formulário
  const updateField = (field: keyof EventFormData, value: string | number | Batch[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Atualiza lote específico
  const updateBatch = (batchId: string, field: keyof Batch, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      batches: (prev.batches || []).map(batch =>
        batch.id === batchId ? { ...batch, [field]: value } : batch
      )
    }));
  };

  // Adiciona novo lote
  const addBatch = () => {
    const newBatch: Batch = {
      id: `batch_${Date.now()}`,
      eventId: '',
      title: '',
      description: '',
      price: 0,
      quantity: 0,
      isActive: true,
      saleStartsAt: null,
      saleEndsAt: null
    };
    
    setFormData(prev => ({
      ...prev,
      batches: [...(prev.batches || []), newBatch]
    }));
  };

  // Remove lote
  const removeBatch = (batchId: string) => {
    setFormData(prev => ({
      ...prev,
      batches: (prev.batches || []).filter(batch => batch.id !== batchId)
    }));
  };

  // Upload de imagem
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (file) {
      // Validação de tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        sonnerToast.error('A imagem deve ter no máximo 5MB.');
        return;
      }
      
      // Validação de tipo
      if (!file.type.startsWith('image/')) {
        sonnerToast.error('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        updateField('image', result);
        

      };
      
      reader.onerror = () => {
        console.error('Erro ao ler arquivo');
        sonnerToast.error('Erro ao processar a imagem. Tente novamente.');
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Remove imagem
  const removeImage = () => {
    setImagePreview('');
    updateField('image', '');
  };

  // Validação de datas melhorada
  const validateDates = (startsAt: string, endsAt: string): { valid: boolean; error?: string } => {
    if (!startsAt || !endsAt) {
      return { valid: false, error: 'Data de início e término são obrigatórias.' };
    }
    
    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);
    const now = new Date();
    
    // Validar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return { valid: false, error: 'Datas inválidas fornecidas.' };
    }
    
    // Validar se a data de início é futura
    if (startDate <= now) {
      return { valid: false, error: 'A data de início deve ser futura.' };
    }
    
    // Validar se a data de término é posterior à data de início
    if (endDate <= startDate) {
      return { valid: false, error: 'A data de término deve ser posterior à data de início.' };
    }
    
    return { valid: true };
  };

  // Validação de URL melhorada
  const validateUrl = async (url: string, currentEventUrl: string): Promise<{ valid: boolean; error?: string }> => {
    if (!url) {
      return { valid: true };
    }
    
    // Validar formato da URL
    const urlRegex = /^[a-z0-9-]+$/;
    if (!urlRegex.test(url)) {
      return { 
        valid: false, 
        error: 'A URL deve conter apenas letras minúsculas, números e hífens.' 
      };
    }
    
    // Se a URL não mudou, não precisa validar
    if (url === currentEventUrl) {
      return { valid: true };
    }
    
    try {
      const existingEvent = await repository.findByUrl(url);
      if (existingEvent) {
        return { 
          valid: false, 
          error: 'Esta URL já está em uso. Escolha outra.'
        };
      }
    } catch (error) {
      console.error('Erro ao validar URL:', error);
    }
    
    return { valid: true };
  };

  // Salva as alterações
  const handleSave = async () => {
    if (isLoading) return; // Previne múltiplas chamadas
    
    setIsLoading(true);
    
    try {
      // Valida se há dados obrigatórios
      if (!formData.title?.trim()) {
        sonnerToast.error('O título do evento é obrigatório.');
        return;
      }
      
      if (!formData.location?.trim()) {
        sonnerToast.error('Local do evento é obrigatório.');
        return;
      }
      
      if (!formData.address?.trim()) {
        sonnerToast.error('Endereço do evento é obrigatório.');
        return;
      }

      // Validação de datas melhorada
      const dateValidation = validateDates(formData.startsAt, formData.endsAt);
      if (!dateValidation.valid) {
        sonnerToast.error(dateValidation.error || 'Erro na validação de datas.');
        return;
      }

      if (!user?.id) {
        sonnerToast.error('Usuário não autenticado. Faça login para continuar.');
        return;
      }

      // Busca o evento atual para obter o ID
      const currentEvent = await repository.findByUrl(url || '');
      if (!currentEvent) {
        sonnerToast.error('Evento não encontrado.');
        return;
      }

      // Verifica se o usuário é o dono do evento
      if (currentEvent.userId !== user.id) {
        sonnerToast.error('Você não pode editar este evento. Fale com o organizador.');
        return;
      }

      // Validação de URL melhorada
      const urlValidation = await validateUrl(formData.url, currentEvent.url);
      if (!urlValidation.valid) {
        sonnerToast.error(urlValidation.error || 'URL inválida.');
        return;
      }

      // Converter datas para formato ISO preservando o horário local
      const convertToLocalISO = (dateTimeString: string) => {
        if (!dateTimeString) return '';
        
        // Se já está no formato ISO, retornar como está
        if (dateTimeString.includes('T') && dateTimeString.includes('Z')) {
          return dateTimeString;
        }
        
        // Criar data local e converter para ISO preservando o horário local
        const localDate = new Date(dateTimeString);
        
        // Criar string ISO manualmente para preservar o horário local
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const hours = String(localDate.getHours()).padStart(2, '0');
        const minutes = String(localDate.getMinutes()).padStart(2, '0');
        const seconds = String(localDate.getSeconds()).padStart(2, '0');
        
        // Retornar no formato ISO sem conversão de fuso horário
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
      };
      
      const startsAt = convertToLocalISO(formData.startsAt);
      const endsAt = convertToLocalISO(formData.endsAt);
      
      // Atualiza o evento usando o repositório
      const updatedEvent = await repository.update(currentEvent.id, {
        title: formData.title,
        description: formData.description,
        startsAt: startsAt,
        endsAt: endsAt,
        location: formData.location,
        address: formData.address,
        url: formData.url,
        image: formData.image
      });

      // Salva os ingressos
      // Criar instância diretamente se necessário
      const batchesRepo = new SupabaseBatchesRepository();
      await batchesRepo.updateBatches(currentEvent.id, formData.batches);
      
      // Mostra toast de sucesso
      sonnerToast.success('Evento atualizado com sucesso.');
      
      // Aguarda um pouco para o usuário ver a mensagem de sucesso
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = 'Erro ao salvar evento';
      
      if (error.message) {
        if (error.message.includes('duplicate key')) {
          errorMessage = 'URL já existe. Escolha uma URL diferente.';
        } else if (error.message.includes('foreign key')) {
          errorMessage = 'Erro de referência no banco de dados.';
        } else if (error.message.includes('not null')) {
          errorMessage = 'Todos os campos obrigatórios devem ser preenchidos.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage = error.message;
        }
      }
      
      sonnerToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tickety-black">
      <AuthenticatedHeader />
      <PageTransition>
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-green/30 border-t-primary-green rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando evento...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-4">Erro ao carregar evento</h1>
              <p className="text-gray-400 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>Voltar ao Início</Button>
            </div>
          </div>
        ) : (
          <main className="container mx-auto px-4 py-6 max-w-7xl pb-24 lg:pb-6">
        {/* Título */}
        <div className="mb-6 lg:mb-2">
          <h1 className="text-2xl font-semibold text-white mb-1 px-4">Editar Evento</h1>
          <p className="text-sm text-gray-400 px-4">Modifique as informações do seu evento</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Imagem do Evento - Mobile First */}
            <div className="lg:hidden">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Imagem do Evento</h3>
                
                {imagePreview ? (
                  <div className="relative group">
                    <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <input
                        id="image-upload-edit-mobile"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="image-upload-edit-mobile" className="cursor-pointer" />
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={removeImage}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 backdrop-blur-sm ml-4"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary-green/10 to-primary-green/5 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-center hover:border-primary-green/50 transition-colors cursor-pointer">
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-primary-green/20 rounded-full flex items-center justify-center mb-3">
                        <ImageIcon size={24} className="text-primary-green" />
                      </div>
                      <p className="text-gray-400 text-sm mb-1">Clique para adicionar imagem</p>
                      <p className="text-gray-500 text-xs">PNG, JPG até 5MB</p>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Dica - Mobile First */}
            <div className="lg:hidden">
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">{EVENT_TIPS.TITLE}</h3>
                <div className="space-y-3 text-sm text-gray-400">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary-green rounded-full mt-2 flex-shrink-0"></div>
                    <p>{EVENT_TIPS.IMAGE_RESOLUTION}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Informações Básicas */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary-green/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary-green font-semibold">1</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Informações Básicas</h2>
                  <p className="text-xs text-gray-400">Dados principais do evento</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-300 mb-3 block">
                    Título do Evento *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white h-12 text-lg font-medium focus:border-primary-green"
                    placeholder="Nome do evento"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-300 mb-3 block">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white resize-none focus:border-primary-green"
                    placeholder="Descreva o evento..."
                    rows={4}
                  />
                </div>

                {/* Data e Horário */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white mb-4">Data e Horário</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DateTimeInput
                      id="startsAt"
                      label="Início do Evento"
                      value={formData.startsAt}
                      onChange={(value) => updateField('startsAt', value)}
                      required
                    />
                    
                    <DateTimeInput
                      id="endsAt"
                      label="Término do Evento"
                      value={formData.endsAt}
                      onChange={(value) => updateField('endsAt', value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="url" className="text-sm font-medium text-gray-300 mb-3 block">
                    URL Personalizada
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="text-gray-400 text-sm mr-2">tickety.com.br/eventos/</span>
                      <Input
                        id="url"
                        value={formData.url || (formData.title ? formData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : '')}
                        onChange={(e) => updateField('url', e.target.value)}
                        className="bg-black/30 border-gray-800 text-white h-12 focus:border-primary-green flex-1"
                        placeholder="nome-do-evento"
                      />
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Local */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary-green/20 rounded-lg flex items-center justify-center">
                  <span className="text-primary-green font-semibold">2</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Local do Evento</h2>
                  <p className="text-xs text-gray-400">Onde acontecerá o evento</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-gray-300 mb-3 block">
                    Nome do Local *
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white h-12 focus:border-primary-green"
                    placeholder="Ex: Arena Eventos"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-300 mb-3 block">
                    Endereço Completo *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    className="bg-black/30 border-gray-800 text-white resize-none focus:border-primary-green"
                    placeholder="Rua, Número, Bairro, Cidade/Estado, CEP"
                    rows={3}
                  />
                </div>
              </div>
            </div>

                        <EventTicketsSection
              batches={formData.batches || []}
              onAddBatch={addBatch}
              onRemoveBatch={removeBatch}
              onUpdateBatch={updateBatch}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              <EventImageSection
                imagePreview={imagePreview}
                onImageUpload={handleImageUpload}
                onRemoveImage={removeImage}
              />

              <EventTipsSection
                title={EVENT_TIPS.TITLE}
                tips={[EVENT_TIPS.IMAGE_RESOLUTION]}
              />

              <EventActionButtons
                onCancel={() => navigate('/')}
                onSave={handleSave}
                isLoading={isLoading}
                hasChanges={hasChanges()}
                saveText="Salvar"
                loadingText="Salvando..."
              />

            </div>
          </div>
        </div>
        
        {/* Barra de Ações - Mobile */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 shadow-2xl p-4">
          <div className="flex items-center justify-between space-x-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="btn-hover-subtle flex-1"
            >
              <X size={16} className="mr-2" />
              Cancelar
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={handleSave}
                    disabled={isLoading || !hasChanges()}
                    className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold gap-2 flex-1"
                  >
                    <Save size={18} />
                    {isLoading ? 'Salvando...' : 'Salvar'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Salvar alterações</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        </main>
        )}
      </PageTransition>
    </div>
  );
};

export default EditEvent;