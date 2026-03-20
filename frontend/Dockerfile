FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copia de todo o projeto para o container (inclusive configs)
COPY . .

# Faz o build da aplicação React/Vite
RUN npm run build

# Instala um servidor estático simples para servir os arquivos em prod
RUN npm install -g serve

EXPOSE 5173

# Serve a pasta 'dist' gerada pelo build na porta 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
