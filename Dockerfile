FROM node:24-slim

# Instal PM2 secara global
# RUN npm install pm2 -g

# Tentukan direktori kerja
WORKDIR /usr/src/app
# 2. Salin file dependensi terlebih dahulu (memanfaatkan cache layer Docker)
COPY package*.json ./

# 3. Jalankan npm install di dalam direktori kerja yang benar
RUN npm install

# 4. Salin seluruh sisa source code aplikasi
COPY . .

# Expose port aplikasi
 EXPOSE 3000

# Jalankan npm install sebelum menyalakan pm2-runtime
# CMD ["sh", "-c", "npm install && pm2-runtime start ecosystem.config.js"]
CMD ["node", "index.js"]