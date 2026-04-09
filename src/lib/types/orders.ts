export type OrdersSourceItem = {
  id: string;
  created_at: string;
  status?: string | null;
  responsavel?: string | null;
  cliente_nome?: string | null;
  plataforma?: string | null;
  atendimento?: string | null;
  bairro?: string | null;
  taxa_entrega?: number | null;
  pagamento?: string | null;
  valor_pago?: number | null;
  valor_final?: number | null;
  troco?: number | null;
  fatias?: number | null;
};
