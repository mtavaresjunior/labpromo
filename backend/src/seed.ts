import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://pelando_user:pelando_password@localhost:5432/pelando_db'
});

const stores = ['Amazon', 'Kabum', 'Mercado Livre', 'Magalu', 'Americanas', 'Submarino', 'Fast Shop', 'Ponto Frio', 'Casas Bahia', 'Shopee', 'AliExpress'];

const productNames = ['Smartphone', 'Notebook', 'Smart TV', 'Monitor', 'Fone de Ouvido Bluetooth', 'Teclado Mecânico', 'Mouse Gamer', 'Cadeira Gamer', 'Placa de Vídeo', 'Processador', 'SSD NVMe', 'Memória RAM', 'Console', 'Jogo', 'Livro', 'Mochila', 'Relógio Smartwatch', 'Caixa de Som', 'Microfone', 'Câmera', 'Fritadeira Air Fryer', 'Cafeteira', 'Aspirador de Pó', 'Geladeira', 'Máquina de Lavar', 'Ar Condicionado', 'Ventilador', 'Micro-ondas'];

const brands = ['Samsung', 'Apple', 'Dell', 'LG', 'Sony', 'Logitech', 'Razer', 'Corsair', 'Asus', 'Acer', 'Lenovo', 'Nintendo', 'PlayStation', 'Xbox', 'JBL', 'Xiaomi', 'Motorola', 'Mondial', 'Oster', 'Philips', 'Electrolux', 'Brastemp', 'Consul', 'Panasonic', 'Philco', 'Britânia'];

const adjectives = ['Gamer', 'Pro', 'Ultra', 'Max', 'Lite', 'Plus', 'Edição Especial', 'Com Fio', 'Sem Fio', 'RGB', '4K', '8K', '144Hz', '1TB', '500GB', '256GB', '128GB', '64GB', '32GB', '16GB', '8GB', 'Inverter', 'Frost Free', 'Digital', 'Smart', 'Bluetooth', 'Wi-Fi', 'Portátil', 'Profissional', 'Premium'];

const comments_text = [
  'Excelente preço! Comprei.',
  'Estava esperando essa promoção há meses.',
  'Alguém sabe se vale a pena?',
  'Já esteve mais barato na Black Friday.',
  'Frete deu R$50 aqui para o Nordeste, infelizmente.',
  'Peguei 2, valeu!',
  'Essa loja é confiável?',
  'O cupom não está funcionando mais.',
  'A qualidade desse produto é surreal.',
  'Pior compra que já fiz, não recomendo.',
  'Ótimo custo-benefício.',
  'Esgotou super rápido, não consegui pegar.',
  'Comprei semana passada por 100 reais a mais 🤡.',
  'Alguém tem um cupom de frete grátis?',
  'Verdes!',
  'Dedo coçando aqui...',
  'Boletei para pensar.',
  'Parcela em até 10x sem juros? Aí sim!',
  'A bateria dura muito pouco, não gostei.',
  'Entrega rápida, chegou no dia seguinte!',
  'Essa promoção foi a melhor do ano!',
  'Meu amigo comprou e recomendou bastante.',
  'Alerta de preço: já esteve pela metade desse valor.',
  'Muito caro, compensa mais importar.'
];

async function seed() {
  await client.connect();
  console.log('Connected to DB...');

  try {
    // 1. Create fake users
    const userIds = [];
    for (let i = 0; i < 15; i++) {
        const username = `usuario_${Math.floor(Math.random() * 10000)}_${i}`;
        const res = await client.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
            [username, `${username}@emailfalso.com`, '123456']
        );
        userIds.push(res.rows[0].id);
    }
    console.log(`Created 15 mock users.`);
    
    // Attempt to add existing users if they exist (deal_hunter and admin are usually IDs 1 and 2)
    // To be safe, just use the newly generated users plus ID 1 and 2 if they exist.
    userIds.push(1, 2);

    // 2. Create 100 deals
    const dealIds = [];
    for (let i = 0; i < 100; i++) {
        const name = productNames[Math.floor(Math.random() * productNames.length)];
        const brand = brands[Math.floor(Math.random() * brands.length)];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        
        const title = `${name} ${brand} ${adj}`;
        const desc = `Super oferta imperdível de ${title}! Não perca essa chance com estoque super limitado. Aproveite a maior queima de estoque da ${stores[Math.floor(Math.random() * stores.length)]}. Produto original com garantia de fábrica.`;
        
        const price = (Math.random() * 3000 + 30).toFixed(2);
        const originalPrice = (Number(price) * (1 + Math.random() * 0.8 + 0.1)).toFixed(2); // 10% to 90% more
        
        const store = stores[Math.floor(Math.random() * stores.length)];
        const poster = userIds[Math.floor(Math.random() * userIds.length)];
        const temp = Math.floor(Math.random() * 600) - 50; // -50 to 550
        const link = `https://www.${store.replace(/ /g, '').toLowerCase()}.com.br/produto/${Math.floor(Math.random()*1000000)}`;
        const image_url = `https://picsum.photos/seed/${encodeURIComponent(title)}/300/300`;

        try {
          const res = await client.query(
              'INSERT INTO deals (title, description, price, original_price, image_url, temperature, store_name, posted_by, link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
              [title, desc, price, originalPrice, image_url, temp, store, poster, link]
          );
          dealIds.push(res.rows[0].id);
        } catch(e) { /* ignore constraint errors if ID doesn't exist etc */ }
    }
    console.log(`Created ${dealIds.length} deals.`);

    // 3. Create comments
    let commentsCount = 0;
    for (const dealId of dealIds) {
        const numComments = Math.floor(Math.random() * 10); // 0 to 9 comments per deal
        for(let i=0; i<numComments; i++) {
            const user = userIds[Math.floor(Math.random() * userIds.length)];
            const text = comments_text[Math.floor(Math.random() * comments_text.length)];
            try {
              await client.query(
                  'INSERT INTO comments (deal_id, user_id, content) VALUES ($1, $2, $3)',
                  [dealId, user, text]
              );
              commentsCount++;
            } catch(e) { /* ignore */ }
        }
    }
    console.log(`Created ${commentsCount} comments.`);

  } catch (err) {
    console.error('Error seeding DB:', err);
  } finally {
    await client.end();
  }
}

seed();
