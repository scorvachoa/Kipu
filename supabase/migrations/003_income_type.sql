-- Añade el tipo de transacción "income" para ingresos (yapeos recibidos,
-- retiros de wardadito que regresan a la cuenta).
alter table public.transactions
  drop constraint transactions_transaction_type_check;

alter table public.transactions
  add constraint transactions_transaction_type_check
  check (
    transaction_type in ('purchase', 'payment', 'transfer', 'withdrawal', 'refund', 'fee', 'income', 'other')
  );
