CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT '123456',
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url VARCHAR(255),
    temperature INTEGER DEFAULT 0,
    store_name VARCHAR(100),
    posted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, deal_id)
);

-- Seed Initial Data
INSERT INTO users (username, email) VALUES 
('admin', 'admin@pelando.clone'),
('deal_hunter', 'hunter@pelando.clone')
ON CONFLICT DO NOTHING;

INSERT INTO deals (title, description, price, original_price, image_url, temperature, store_name, posted_by) VALUES 
('Smartphone Samsung Galaxy S23 256GB', 'Excelente smartphone top de linha.', 3500.00, 4999.00, 'https://picsum.photos/seed/s23/300/300', 85, 'Loja Online', 1),
('Notebook Dell Inspiron 15', 'Notebook i5 12a ger, 8GB, 256GB SSD', 2800.00, 3500.00, 'https://picsum.photos/seed/dell15/300/300', 40, 'Computadores Express', 2),
('Smart TV LG 55" 4K', 'TV de alta qualidade', 2100.00, 3000.00, 'https://picsum.photos/seed/tv55/300/300', 120, 'EletrônicosBR', 1)
ON CONFLICT DO NOTHING;
