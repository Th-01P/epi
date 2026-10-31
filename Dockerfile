# Usa a imagem oficial e leve do Nginx baseada em Alpine Linux
FROM nginx:alpine

# Define o diretório de trabalho padrão dentro do container
WORKDIR /usr/share/nginx/html

# Remove os arquivos de exemplo padrão do Nginx
RUN rm -rf ./*

# Copia todos os arquivos do seu projeto para a pasta do Nginx
COPY . .

# Expõe a porta 80, que é a porta padrão que o Nginx utiliza para servir o site
EXPOSE 80

# Inicia o servidor Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]