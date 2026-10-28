FROM node:22-alpine
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
# El motor del Billar se monta desde el repositorio backend en /app/backend/shared (ver docker-compose)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
