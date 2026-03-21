CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT '123456',
    avatar_url VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Outros',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deals (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url VARCHAR(255),
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    store_name VARCHAR(100),
    category VARCHAR(100) DEFAULT 'Outros',
    link VARCHAR(255),
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    posted_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    store_name VARCHAR(100),
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, deal_id)
);

CREATE TABLE IF NOT EXISTS deal_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, deal_id)
);

CREATE TABLE IF NOT EXISTS comment_votes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    vote_type INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, comment_id)
);

-- Seed Initial Data
INSERT INTO users (username, email, is_admin) VALUES 
('admin', 'admin@pelando.clone', TRUE),
('deal_hunter', 'hunter@pelando.clone', FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO deals (title, description, price, original_price, image_url, likes_count, dislikes_count, store_name, posted_by) VALUES 
('Smartphone Samsung Galaxy S23 256GB', 'Excelente smartphone top de linha.', 3500.00, 4999.00, 'https://picsum.photos/seed/s23/300/300', 0, 0, 'Loja Online', 1),
('Notebook Dell Inspiron 15', 'Notebook i5 12a ger, 8GB, 256GB SSD', 2800.00, 3500.00, 'https://picsum.photos/seed/dell15/300/300', 0, 0, 'Computadores Express', 2),
('Smart TV LG 55" 4K', 'TV de alta qualidade', 2100.00, 3000.00, 'https://picsum.photos/seed/tv55/300/300', 0, 0, 'EletrônicosBR', 1)
ON CONFLICT DO NOTHING;
