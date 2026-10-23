FROM node:24-slim

# Instal PM2 secara global
# RUN npm install pm2 -g
RUN npm install

# Tentukan direktori kerja
WORKDIR /usr/src/app

# Expose port aplikasi
EXPOSE 3000

# Jalankan npm install sebelum menyalakan pm2-runtime
# Ini memastikan node_modules selalu siap di dalam container
# CMD ["sh", "-c", "npm install && pm2-runtime start ecosystem.config.js"]
CMD ["node", "index.js"]