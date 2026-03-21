import { Pool } from 'pg';

const pool = new Pool({
    user: process.env.DB_USER || 'pelando_user',
    password: process.env.DB_PASSWORD || 'pelando_password',
    host: process.env.DB_HOST || 'db',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'pelando_db',
});

const stores = ['KaBuM!', 'Terabyte', 'Pichau', 'Amazon', 'Mercado Livre', 'AliExpress', 'Fast Shop', 'Magazine Luiza'];

const productTemplates = [
    // Processadores
    { name: 'Processador AMD Ryzen 5 5600X', category: 'Processador', base: 950, img: 'https://m.media-amazon.com/images/I/61vGQNUEsGL._AC_SL1384_.jpg' },
    { name: 'Processador AMD Ryzen 7 5700X', category: 'Processador', base: 1200, img: 'https://m.media-amazon.com/images/I/61vGQNUEsGL._AC_SL1384_.jpg' },
    { name: 'Processador AMD Ryzen 7 7800X3D', category: 'Processador', base: 2800, img: 'https://m.media-amazon.com/images/I/51wN7423oVL._AC_SL1107_.jpg' },
    { name: 'Processador Intel Core i5-13400F', category: 'Processador', base: 1300, img: 'https://m.media-amazon.com/images/I/51n0yQJ1dXL._AC_SL1010_.jpg' },
    { name: 'Processador Intel Core i7-14700K', category: 'Processador', base: 2900, img: 'https://m.media-amazon.com/images/I/61dBE228v8L._AC_SL1215_.jpg' },
    { name: 'Processador Intel Core i9-13900K', category: 'Processador', base: 3800, img: 'https://m.media-amazon.com/images/I/61dBE228v8L._AC_SL1215_.jpg' },

    // Placas de Vídeo
    { name: 'Placa de Vídeo RTX 3060 12GB Galax', category: 'Placa de Vídeo', base: 1700, img: 'https://m.media-amazon.com/images/I/71xNqU2O4fL._AC_SL1500_.jpg' },
    { name: 'Placa de Vídeo RTX 4060 8GB Asus Dual', category: 'Placa de Vídeo', base: 1900, img: 'https://m.media-amazon.com/images/I/71zD3D7ZkBL._AC_SL1500_.jpg' },
    { name: 'Placa de Vídeo RTX 4070 Super 12GB MSI', category: 'Placa de Vídeo', base: 4200, img: 'https://m.media-amazon.com/images/I/71lR4U0R7XL._AC_SL1500_.jpg' },
    { name: 'Placa de Vídeo RX 6600 8GB ASRock', category: 'Placa de Vídeo', base: 1350, img: 'https://m.media-amazon.com/images/I/61Qh3V4Z+7L._AC_SL1000_.jpg' },
    { name: 'Placa de Vídeo RX 6750 XT 12GB XFX', category: 'Placa de Vídeo', base: 2300, img: 'https://m.media-amazon.com/images/I/71Xm+W6kKFL._AC_SL1500_.jpg' },
    { name: 'Placa de Vídeo RX 7800 XT 16GB Sapphire', category: 'Placa de Vídeo', base: 3800, img: 'https://m.media-amazon.com/images/I/81vYkYJqD4L._AC_SL1500_.jpg' },

    // Memória RAM
    { name: 'Memória RAM Kingston Fury Beast 16GB 3200MHz DDR4', category: 'Memória RAM', base: 260, img: 'https://m.media-amazon.com/images/I/51A1iHn2cNL._AC_SL1000_.jpg' },
    { name: 'Memória RAM Corsair Vengeance 16GB 3600MHz DDR4', category: 'Memória RAM', base: 290, img: 'https://m.media-amazon.com/images/I/61TfD1Z4mGL._AC_SL1500_.jpg' },
    { name: 'Memória RAM XPG Lancer 32GB (2x16) 6000MHz DDR5', category: 'Memória RAM', base: 850, img: 'https://m.media-amazon.com/images/I/61wL9C+E-QL._AC_SL1500_.jpg' },
    { name: 'Memória RAM Corsair Vengeance RGB 32GB 5600MHz DDR5', category: 'Memória RAM', base: 900, img: 'https://m.media-amazon.com/images/I/71yF+9qG6SL._AC_SL1500_.jpg' },

    // Armazenamento
    { name: 'SSD Kingston NV2 1TB M.2 NVMe', category: 'Armazenamento', base: 350, img: 'https://m.media-amazon.com/images/I/61XzP+t2k8L._AC_SL1500_.jpg' },
    { name: 'SSD WD Blue SN580 1TB M.2 NVMe', category: 'Armazenamento', base: 450, img: 'https://m.media-amazon.com/images/I/61vYkYJqD4L._AC_SL1500_.jpg' },
    { name: 'SSD Samsung 990 PRO 2TB M.2 NVMe', category: 'Armazenamento', base: 1200, img: 'https://m.media-amazon.com/images/I/81xP2D35N7L._AC_SL1500_.jpg' },
    { name: 'SSD Crucial BX500 480GB SATA', category: 'Armazenamento', base: 180, img: 'https://m.media-amazon.com/images/I/61R-4Z6Yx5L._AC_SL1500_.jpg' },

    // Placa-mãe
    { name: 'Placa-Mãe Gigabyte B550M Aorus Elite (AM4)', category: 'Placa-mãe', base: 850, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Placa-Mãe Asus TUF Gaming B550M-Plus (AM4)', category: 'Placa-mãe', base: 950, img: 'https://m.media-amazon.com/images/I/81D3L+b3MFL._AC_SL1500_.jpg' },
    { name: 'Placa-Mãe MSI B650M Mortar (AM5)', category: 'Placa-mãe', base: 1400, img: 'https://m.media-amazon.com/images/I/81oG+XQn7eL._AC_SL1500_.jpg' },
    { name: 'Placa-Mãe ASRock B760M Pro RS (LGA1700)', category: 'Placa-mãe', base: 1100, img: 'https://m.media-amazon.com/images/I/81zD3D7ZkBL._AC_SL1500_.jpg' },

    // Fonte
    { name: 'Fonte Corsair RM750x 750W 80 Plus Gold Modular', category: 'Fonte', base: 750, img: 'https://m.media-amazon.com/images/I/71T2u+8Rz1L._AC_SL1500_.jpg' },
    { name: 'Fonte XPG Core Reactor 850W 80 Plus Gold Modular', category: 'Fonte', base: 820, img: 'https://m.media-amazon.com/images/I/61r5f8zZJzL._AC_SL1000_.jpg' },
    { name: 'Fonte MSI MAG A650BN 650W 80 Plus Bronze', category: 'Fonte', base: 350, img: 'https://m.media-amazon.com/images/I/61K0WfEZj7L._AC_SL1500_.jpg' },

    // Gabinete
    { name: 'Gabinete Montech Air 903 Max Preto', category: 'Gabinete', base: 350, img: 'https://m.media-amazon.com/images/I/61zD3D7ZkBL._AC_SL1500_.jpg' },
    { name: 'Gabinete Lian Li Lancool 216 RGB Branco', category: 'Gabinete', base: 750, img: 'https://m.media-amazon.com/images/I/81R4Z6Yx5L._AC_SL1500_.jpg' },
    { name: 'Gabinete NZXT H5 Flow Compacto Preto', category: 'Gabinete', base: 600, img: 'https://m.media-amazon.com/images/I/71R4Z6Yx5L._AC_SL1500_.jpg' },

    // Periféricos
    { name: 'Mouse Logitech G Pro X Superlight Wireless', category: 'Periféricos', base: 750, img: 'https://m.media-amazon.com/images/I/51A1iHn2cNL._AC_SL1000_.jpg' },
    { name: 'Mouse Razer DeathAdder V3 Pro Wireless', category: 'Periféricos', base: 850, img: 'https://m.media-amazon.com/images/I/61E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Teclado Mecânico Redragon Kumara Switch Outemu Red', category: 'Periféricos', base: 180, img: 'https://m.media-amazon.com/images/I/71E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Teclado Mecânico Keychron K8 Pro Wireless', category: 'Periféricos', base: 800, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Headset Gamer HyperX Cloud II Red', category: 'Periféricos', base: 450, img: 'https://m.media-amazon.com/images/I/71E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Headset Gamer Logitech G432 7.1', category: 'Periféricos', base: 280, img: 'https://m.media-amazon.com/images/I/61E1Q8Z3HdL._AC_SL1500_.jpg' },

    // Monitor
    { name: 'Monitor Gamer LG UltraGear 24" 144Hz IPS', category: 'Monitor', base: 900, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Monitor Gamer AOC Hero 27" 165Hz IPS', category: 'Monitor', base: 1100, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Monitor Alienware 27" 240Hz 1440p Fast IPS', category: 'Monitor', base: 3500, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },

    // Notebooks
    { name: 'Notebook Lenovo IdeaPad Gaming 3i GTX 1650', category: 'Notebooks', base: 3200, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Notebook Dell G15 RTX 4050 i5 13a', category: 'Notebooks', base: 5500, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Notebook Apple MacBook Air M1 8GB 256GB', category: 'Notebooks', base: 5800, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Notebook Asus Vivobook 15 Ryzen 5 8GB 256GB', category: 'Notebooks', base: 2300, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },

    // Smartphones
    { name: 'Smartphone Samsung Galaxy S23 256GB', category: 'Smartphones', base: 3300, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Smartphone iPhone 15 128GB', category: 'Smartphones', base: 4500, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Smartphone Motorola Edge 40 Neo', category: 'Smartphones', base: 1800, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
    { name: 'Smartphone Xiaomi Poco X6 Pro 512GB', category: 'Smartphones', base: 2200, img: 'https://m.media-amazon.com/images/I/81E1Q8Z3HdL._AC_SL1500_.jpg' },
];

const adjectives = ['Excelente', 'Melhor preço', 'Promoção insana', 'Ótimo Custo-benefício', 'Corre que tá barato', 'Baixou demais', 'Preço top', 'Descontão', 'Imperdível', 'Sensacional'];

async function seed() {
    try {
        console.log('Ensure unique name constraint on products...');
        await pool.query('ALTER TABLE products ADD CONSTRAINT products_name_key UNIQUE (name) ON CONFLICT DO NOTHING;').catch(()=>null);
        await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS products_name_idx ON products(name);').catch(()=>null);

        console.log('Inserting base users if missing...');
        await pool.query("INSERT INTO users (id, username, email, is_admin) VALUES (1, 'admin', 'admin@pelando.clone', TRUE), (2, 'deal_hunter', 'hunter@pelando.clone', FALSE) ON CONFLICT DO NOTHING;");

        console.log('Generating 500 deals...');
        
        let insertedCount = 0;

        for (let i = 0; i < 500; i++) {
            // Pick random template
            const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];
            
            // Insert product if not exists
            const prodRes = await pool.query(
                "INSERT INTO products (name, category) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id",
                [template.name, template.category]
            );
            
            let productId = null;
            if (prodRes.rows.length > 0) {
                productId = prodRes.rows[0].id;
            } else {
                // If the constraint is just unique index, ON CONFLICT DO UPDATE will return id.
                const fallback = await pool.query("SELECT id FROM products WHERE name = $1", [template.name]);
                if (fallback.rows.length > 0) productId = fallback.rows[0].id;
            }

            const store = stores[Math.floor(Math.random() * stores.length)];
            
            // Price variance: 70% to 105% of base price
            const variance = 0.70 + Math.random() * 0.35;
            const price = parseFloat((template.base * variance).toFixed(2));
            const originalPrice = parseFloat((price * (1.1 + Math.random() * 0.4)).toFixed(2));
            
            const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const title = `[${store}] ${template.name} - ${adj}`;
            const description = `Promoção encontrada na ${store}. Produto da marca excelente. \n\nDetalhes da oferta: ${template.name} saindo por R$${price}.\n\nAproveite antes que acabe o estoque!`;
            
            const link = `https://www.${store.toLowerCase().replace(/[^a-z]/g, '')}.com.br/produto/${Math.floor(Math.random() * 999999)}`;
            
            // Random likes/dislikes
            const likes = Math.floor(Math.random() * 150);
            const dislikes = Math.floor(Math.random() * 20);

            // Random dates in the last 6 months
            const daysAgo = Math.floor(Math.random() * 180);
            const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

            const dealRes = await pool.query(
                `INSERT INTO deals 
                (title, description, price, original_price, image_url, likes_count, dislikes_count, store_name, category, link, product_id, posted_by, created_at) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
                [title, description, price, originalPrice, template.img, likes, dislikes, store, template.category, link, productId, 2, createdAt]
            );

            // Insert into price history
            if (productId) {
                await pool.query(
                    "INSERT INTO price_history (product_id, price, store_name, deal_id, recorded_at) VALUES ($1, $2, $3, $4, $5)",
                    [productId, price, store, dealRes.rows[0].id, createdAt]
                );
            }
            
            insertedCount++;
            if (insertedCount % 50 === 0) {
                console.log(`Inserted ${insertedCount} deals...`);
            }
        }

        console.log('Successfully seeded 500 realistic deals!');
    } catch (err) {
        console.error('Fatal error during seeding:', err);
    } finally {
        await pool.end();
    }
}

seed();
