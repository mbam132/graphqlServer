FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install prisma@5.3.1
RUN npm run build

CMD ["npm", "start"]

CMD ["/bin/sh", "./script.sh"]
EXPOSE 4000