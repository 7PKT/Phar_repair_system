# --------- Build Stage ---------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# RUN npm install
RUN npm ci 

COPY . .
# ✅ ลบ build เก่า (ถ้ามี) แล้วค่อย build ใหม่
RUN rm -rf build && npm run build

# ---------- Production Stage ----------
# FROM nginx:1.27-alpine
# COPY --from=builder /app/build /usr/share/nginx/html
# COPY nginx/default.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
# CMD ["nginx", "-g", "daemon off;"]