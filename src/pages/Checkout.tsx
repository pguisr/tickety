import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Shield, User, Mail, Phone, MapPin, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate, useLocation } from 'react-router-dom';
import { Event, TicketQuantities, CheckoutData, TicketData } from '@/types';
import PublicHeader from '@/components/PublicHeader';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import { useAuth } from '@/contexts/AuthContext';
import PageTransition from '@/components/PageTransition';
import { formatDateTimeRangeFromTimestamps, formatDateTimeFromTimestamp, formatPriceWithoutSymbol, formatPhone, formatCPF } from '@/lib/utils';
import { CheckoutService } from '@/services/checkout';
import { toast as sonnerToast } from 'sonner';
import { userRepository } from '@/repositories/UserRepository';
import { validateEmail, validateCPF, validatePhone, validateRequired } from '@/utils/validations';
import ValidatedInput from '@/components/ValidatedInput';
import CreditCardInput from '@/components/CreditCardInput';


const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Dados do evento e ingressos
  const eventData = location.state?.event as Event;
  const ticketQuantities = location.state?.ticketQuantities as TicketQuantities;
  const orderId = location.state?.orderId as string;

  // Scroll para o topo quando a página carrega
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Buscar e preencher dados do usuário automaticamente
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.id) {
        console.log('Checkout - Carregando dados do usuário:', user.id);
        try {
          const userData = await userRepository.getUserById(user.id);
          console.log('Checkout - Dados do usuário carregados:', userData);
          if (userData) {
            setCheckoutData(prev => ({
              ...prev,
              fullName: userData.full_name || '',
              email: userData.email || '',
              phone: userData.phone || '',
              cpf: userData.cpf || ''
            }));
            console.log('Checkout - Dados preenchidos automaticamente');
          }
        } catch (error) {
          console.error('Erro ao carregar dados do usuário:', error);
        }
      }
    };

    loadUserData();
  }, [user?.id]);

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    fullName: '',
    email: '',
    phone: '',
    cpf: '',
    paymentMethod: 'credit',
    ticketData: []
  });

  const [isLoading, setIsLoading] = useState(false);

  // Verificar se o usuário está autenticado (OBRIGATÓRIO)
  useEffect(() => {
    if (!user) {
      navigate('/auth', { 
        state: { 
          message: 'É necessário fazer login para continuar com a compra',
          returnUrl: '/compra'
        }
      });
    }
  }, [user, navigate]);

  // Se não houver dados do evento ou orderId, redireciona
  useEffect(() => {
    if (!eventData || !ticketQuantities || !orderId) {
      navigate('/');
    }
  }, [eventData, ticketQuantities, orderId, navigate]);

  // Se não há dados necessários, não renderiza
  if (!user || !eventData || !ticketQuantities || !orderId) {
    return null;
  }

  const totalQuantity = Object.values(ticketQuantities || {}).reduce((sum, qty) => sum + qty, 0);
  const subtotal = eventData?.batches?.reduce((sum, batch) => {
    return sum + (batch.price * (ticketQuantities?.[batch.id] || 0));
  }, 0) || 0;
  const serviceFee = 5;
  const finalTotal = subtotal + serviceFee;

  // Validação dos campos
  const isFormValid = () => {
    // Validar campos obrigatórios
    const nameValidation = validateRequired(checkoutData.fullName, 'Nome completo');
    const emailValidation = validateEmail(checkoutData.email);
    const phoneValidation = validatePhone(checkoutData.phone);
    const cpfValidation = validateCPF(checkoutData.cpf);
    
    const hasRequiredFields = nameValidation.valid && 
                             emailValidation.valid && 
                             phoneValidation.valid && 
                             cpfValidation.valid;
    
    // Validar dados de pagamento se for cartão de crédito
    const hasPaymentData = checkoutData.paymentMethod === 'credit' 
      ? (checkoutData.cardNumber && checkoutData.cardExpiry && checkoutData.cardCvv && checkoutData.cardHolder)
      : true;
    
    return hasRequiredFields && hasPaymentData;
  };

  // Calcular progresso do formulário
  const getFormProgress = () => {
    const totalFields = 4; // nome, email, telefone, cpf
    const paymentFields = 4; // número, validade, cvv, titular
    
    let validFields = 0;
    
    // Campos obrigatórios
    if (validateRequired(checkoutData.fullName, 'Nome completo').valid) validFields++;
    if (validateEmail(checkoutData.email).valid) validFields++;
    if (validatePhone(checkoutData.phone).valid) validFields++;
    if (validateCPF(checkoutData.cpf).valid) validFields++;
    
    // Campos de pagamento (se cartão de crédito)
    if (checkoutData.paymentMethod === 'credit') {
      if (checkoutData.cardNumber && checkoutData.cardNumber.replace(/\s/g, '').length >= 13) validFields++;
      if (checkoutData.cardExpiry && /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(checkoutData.cardExpiry)) validFields++;
      if (checkoutData.cardCvv && checkoutData.cardCvv.length >= 3) validFields++;
      if (checkoutData.cardHolder && checkoutData.cardHolder.trim().length >= 3) validFields++;
    }
    
    const totalRequiredFields = totalFields + paymentFields;
    return totalRequiredFields > 0 ? Math.round((validFields / totalRequiredFields) * 100) : 0;
  };

  // Função para validar campos específicos e mostrar erros
  const validateField = (field: keyof CheckoutData, value: string) => {
    switch (field) {
      case 'fullName':
        return validateRequired(value, 'Nome completo');
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'cpf':
        return validateCPF(value);
      default:
        return { valid: true };
    }
  };

  const handleInputChange = (field: keyof CheckoutData, value: string) => {
    setCheckoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinishPurchase = async () => {
    // Validação detalhada dos campos
    const nameValidation = validateRequired(checkoutData.fullName, 'Nome completo');
    const emailValidation = validateEmail(checkoutData.email);
    const phoneValidation = validatePhone(checkoutData.phone);
    const cpfValidation = validateCPF(checkoutData.cpf);
    
    if (!nameValidation.valid) {
      sonnerToast.error(nameValidation.error);
      return;
    }
    
    if (!emailValidation.valid) {
      sonnerToast.error(emailValidation.error);
      return;
    }
    
    if (!phoneValidation.valid) {
      sonnerToast.error(phoneValidation.error);
      return;
    }
    
    if (!cpfValidation.valid) {
      sonnerToast.error(cpfValidation.error);
      return;
    }
    
    // Validar dados de pagamento se for cartão de crédito
    if (checkoutData.paymentMethod === 'credit') {
      if (!checkoutData.cardNumber || !checkoutData.cardExpiry || !checkoutData.cardCvv || !checkoutData.cardHolder) {
        sonnerToast.error('Preencha todos os dados do cartão de crédito.');
        return;
      }
    }

    if (!orderId) {
      sonnerToast.error('Pedido não encontrado. Verifique o código e tente de novo.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await CheckoutService.processCheckout(
        orderId,
        checkoutData.paymentMethod || 'credit',
        {
          buyerName: checkoutData.fullName,
          buyerEmail: checkoutData.email,
          buyerPhone: checkoutData.phone || null,
        },
        undefined
      );

      if (result.success) {
        sonnerToast.success('Compra concluída. Verifique seu email para confirmar.');
        navigate('/');
      } else {
        sonnerToast.error(result.error || 'Falha ao finalizar compra. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      sonnerToast.error('Falha ao finalizar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tickety-black">
      {user ? <AuthenticatedHeader /> : <PublicHeader />}
      
      <PageTransition>
                <main className="container mx-auto px-4 py-6 max-w-4xl pb-32">
          {/* Título */}
            <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-1 px-4">{eventData.title}</h1>
                </div>
                
          {/* Card Principal */}
          <Card className="glass-card border-gray-600 max-w-4xl mx-auto">
            <CardContent className="p-8">
              {/* Indicador de Progresso Minimalista */}
              <div className="mb-6">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-primary-green h-1 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${getFormProgress()}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-8">
                {/* Dados do Comprador */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Dados do comprador</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ValidatedInput
                      id="fullName"
                      label="Nome completo"
                      value={checkoutData.fullName}
                      onChange={(value) => handleInputChange('fullName', value)}
                      validate={(value) => validateRequired(value, 'Nome completo')}
                      placeholder="Nome completo"
                      required
                    />
                    <ValidatedInput
                      id="email"
                      label="E-mail"
                      value={checkoutData.email}
                      onChange={(value) => handleInputChange('email', value)}
                      validate={validateEmail}
                      placeholder="seu@email.com"
                      type="email"
                      required
                    />
                    <ValidatedInput
                      id="phone"
                      label="Celular"
                      value={checkoutData.phone}
                      onChange={(value) => handleInputChange('phone', formatPhone(value))}
                      validate={validatePhone}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                      required
                    />
                    <ValidatedInput
                      id="cpf"
                      label="CPF"
                      value={checkoutData.cpf}
                      onChange={(value) => handleInputChange('cpf', formatCPF(value))}
                      validate={validateCPF}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                    />
                  </div>
                    </div>
                    
                {/* Forma de Pagamento */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-6">Forma de pagamento</h3>
                                              <RadioGroup
                          value={checkoutData.paymentMethod}
                          onValueChange={(value) => handleInputChange('paymentMethod', value)}
                          className="space-y-3"
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="credit" id="credit" />
                            <Label htmlFor="credit" className="text-white cursor-pointer">Cartão de Crédito</Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="pix" id="pix" />
                            <Label htmlFor="pix" className="text-white cursor-pointer">PIX</Label>
                          </div>
                        </RadioGroup>
                        </div>
                        
                {/* Dados do Cartão */}
                                             {checkoutData.paymentMethod === 'credit' && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6">Dados do cartão</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <CreditCardInput
                                id="cardNumber"
                                label="Número do cartão"
                                value={checkoutData.cardNumber || ''}
                                onChange={(value) => handleInputChange('cardNumber', value)}
                                placeholder="0000 0000 0000 0000"
                                validationType="cardNumber"
                                required
                              />
                            </div>
                            <CreditCardInput
                              id="cardExpiry"
                              label="Validade"
                              value={checkoutData.cardExpiry || ''}
                              onChange={(value) => handleInputChange('cardExpiry', value)}
                              placeholder="MM/AA"
                              maxLength={5}
                              validationType="expiry"
                              required
                            />
                            <CreditCardInput
                              id="cardCvv"
                              label="CVV"
                              value={checkoutData.cardCvv || ''}
                              onChange={(value) => handleInputChange('cardCvv', value)}
                              placeholder="123"
                              maxLength={4}
                              validationType="cvv"
                              required
                            />
                            <div className="md:col-span-2">
                              <CreditCardInput
                                id="cardHolder"
                                label="Nome impresso no cartão"
                                value={checkoutData.cardHolder || ''}
                                onChange={(value) => handleInputChange('cardHolder', value)}
                                placeholder="Nome como aparece no cartão"
                                validationType="holder"
                                required
                              />
                            </div>
                          </div>
                    

                  </div>
                )}

                {/* Dados do PIX */}
                {checkoutData.paymentMethod === 'pix' && (
                  <div>
                    <h3 className="text-xl font-bold text-white mb-6">Pagamento PIX</h3>
                    <div className="bg-black/30 rounded-lg p-6 border border-gray-800">
                      <div className="text-center space-y-4">
                        {/* Ícone PIX */}
                        <div className="w-16 h-16 bg-primary-green/20 rounded-full flex items-center justify-center mx-auto">
                          <QrCode className="w-8 h-8 text-primary-green" />
                        </div>
                        
                        {/* Informações */}
                        <div className="space-y-2">
                          <h4 className="text-white font-semibold text-lg">Pagamento Instantâneo</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            Após confirmar a compra, você receberá um QR Code para pagamento via PIX.
                          </p>
                          <p className="text-gray-400 text-xs">
                            O pagamento será processado instantaneamente após a confirmação.
                          </p>
                        </div>
                        
                        {/* Status */}
                        <div className="bg-primary-green/10 border border-primary-green/30 rounded-lg p-3">
                          <p className="text-primary-green font-medium text-sm">
                            QR Code será gerado após confirmação
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumo da Compra */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-xl font-bold text-white mb-4">Resumo da compra</h3>

                  {/* Detalhes dos ingressos */}
                  <div className="space-y-3 mb-4">
                    {Object.entries(ticketQuantities).map(([batchId, quantity]) => {
                      const batch = eventData.batches?.find(b => b.id === batchId);
                      if (!batch || quantity === 0) return null;
                        
                        return (
                        <div key={batchId} className="flex justify-between items-center text-sm">
                            <div className="flex-1 min-w-0">
                            <div className="text-white font-medium truncate">{batch.title}</div>
                              <div className="text-gray-400 text-xs">{quantity}x</div>
                            </div>
                          <span className="text-white font-semibold ml-3">R$ {formatPriceWithoutSymbol(batch.price * quantity)}</span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Valores */}
                  <div className="space-y-2 border-t border-gray-700 pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal (para o produtor)</span>
                      <span className="text-white">R$ {formatPriceWithoutSymbol(subtotal)}</span>
                      </div>
                    
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Taxa de serviço (plataforma)</span>
                      <span className="text-white">R$ {formatPriceWithoutSymbol(serviceFee)}</span>
                      </div>
                    
                    <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-lg">
                        <span className="text-white">Total a pagar</span>
                      <span className="text-primary-green">R$ {formatPriceWithoutSymbol(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

                    {/* Botões de Navegação */}
          <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800 shadow-2xl transition-all duration-300 ease-in-out p-5 z-50">
            <div className="container mx-auto max-w-5xl">
              <div className="flex justify-center sm:justify-between items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="btn-hover-subtle h-14 px-6 rounded-full transition-all duration-200 flex-1 max-w-[200px]"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar
                </Button>
                
                <Button
                  onClick={handleFinishPurchase}
                  disabled={!isFormValid() || isLoading}
                  className="bg-primary-green hover:bg-primary-green/90 text-black font-semibold h-14 px-8 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-1 max-w-[200px]"
                >
                  <Shield size={16} className="mr-2" />
                  {isLoading ? 'Processando...' : 'Comprar agora'}
                </Button>
                </div>
              </div>
            </div>
        </main>
      </PageTransition>
    </div>
  );
};

export default Checkout;
