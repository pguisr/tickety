# 🔄 Fluxo Atual do Sistema de Tickets (Simplificado)

## 1. 📋 Criação de Evento

1. **Produtor cria evento** → status: 'published'
2. **Produtor adiciona batches** → quantity inicial definida
3. **Sistema cria tickets físicos** → status: 'available'
4. **Quantity do batch** = quantidade de tickets 'available'

## 2. 🎫 Compra de Tickets

1. **Cliente seleciona tickets** na página do evento
2. **Cliente clica "Finalizar compra"** → `createOrder()`
   ├── Verifica disponibilidade
   ├── Cria order → status: 'pending'
   ├── Cria order_items
   └── Retorna orderId
   > **⚠️ IMPORTANTE**: Quantity NÃO diminui aqui!

3. **Cliente vai para /checkout**
4. **Cliente preenche dados e clica "Comprar agora"** → `processCheckout()`
   ├── Atualiza order → status: 'paid'
   ├── Cria registro de pagamento
   ├── Cria tickets físicos → status: 'sold'
   ├── **Diminui quantity dos batches** (apenas após confirmação do pagamento)
   └── Retorna tickets

## 3. 📊 Estados dos Tickets

- **'available'** → Disponível para compra
- **'sold'** → Vendido e pago
- **'used'** → Já foi usado no evento
- **'cancelled'** → Cancelado

## 4. 🛒 Estados das Orders

- **'pending'** → Aguardando pagamento
- **'paid'** → Pago e confirmado
- **'failed'** → Falha no pagamento
- **'cancelled'** → Cancelado pelo usuário
- > **❌ REMOVIDO**: Status 'expired' (não há mais expiração automática)

## 5. 🔢 Gerenciamento de Quantity

- **Quantity** = número de tickets 'available'
- **NÃO diminui** quando order é criada
- **Diminui APENAS** quando pagamento é confirmado
- **Pode ser 0** (todos vendidos)
- > **✅ SIMPLES**: Quantity sempre reflete tickets realmente disponíveis

## 6. ⚡ Validações

- Máximo 10 tickets por lote por compra
- Verifica se evento está 'published'
- Verifica se evento não passou
- Verifica disponibilidade antes de criar order
- Impede quantity negativa

## 7. 🎯 Vantagens do Fluxo Simplificado

### ✅ **Simplicidade**
- Sem lógica complexa de expiração
- Sem limpeza automática
- Sem problemas de timezone

### ✅ **Lógica Clara**
- Quantity só diminui quando realmente vendido
- Sem "reservas" temporárias
- Fluxo linear e previsível

### ✅ **Confiabilidade**
- Sem orders "pendentes" bloqueando tickets
- Sem risco de tickets perdidos
- Sistema mais estável

### ✅ **Manutenibilidade**
- Menos código para manter
- Menos bugs potenciais
- Mais fácil de debugar

## 8. 🔄 Fluxo Visual

```
Evento Criado
     ↓
Tickets Available (quantity = X)
     ↓
Cliente Seleciona Tickets
     ↓
createOrder() → Order 'pending' (quantity = X)
     ↓
Cliente Paga
     ↓
processCheckout() → Order 'paid' + Tickets 'sold' + quantity = X-Y
```

## 9. 🚫 O que foi Removido

- ❌ Sistema de expiração automática
- ❌ Status 'expired' nas orders
- ❌ Limpeza automática a cada 10 minutos
- ❌ Restauração de quantities
- ❌ Reserva temporária de tickets
- ❌ OrderCleanupService
- ❌ Scripts SQL de limpeza

## 10. 🎉 Resultado Final

**Sistema mais simples, confiável e fácil de entender!**

- Quantity sempre reflete a realidade
- Sem complexidade desnecessária
- Fluxo linear e previsível
- Menos pontos de falha
- Mais fácil de manter e debugar
