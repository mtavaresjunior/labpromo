# Atualização do Banco de Dados para Histórico de Preços

Para criar as novas tabelas sem perder os dados das promoções que você já tem no ar, copie e cole o comando abaixo no terminal do seu servidor local (na mesma pasta do `docker-compose.yml`):

```bash
docker compose exec db psql -U pelando_user -d pelando_db -c "
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Outros',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE deals
ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    store_name VARCHAR(100),
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"
```
