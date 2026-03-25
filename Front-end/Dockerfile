FROM nginx:alpine

# Remove config padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nossa config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos do frontend
COPY files/ /usr/share/nginx/html/

EXPOSE 80
