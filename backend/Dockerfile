FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend/src ./backend/src
COPY frontend ./frontend

RUN mkdir -p /app/backend/uploads

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "src/server.js"]
