FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV VITE_API_URL=http://localhost:3000

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview"]