FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache libreoffice fontconfig ttf-freefont
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
