# Publicar projeto EXCELLPROCESSADOR no GitHub

Para jogar o projeto "EXCELLPROCESSADOR" do ambiente do Firebase Studio para o seu repositório público no GitHub (**marciointra-repositorio.github.io**), siga os passos abaixo utilizando o terminal da sua máquina virtual.

## Pré-requisitos
- Você já deve ter um repositório vazio criado no GitHub com o nome **marciointra-repositorio.github.io**.
- O Git deve estar instalado na máquina virtual.
- Você precisará usar um **Personal Access Token (PAT)** do GitHub para autenticação, pois o login com usuário e senha foi descontinuado.

## Passo a Passo via Terminal

### 1. Navegue até o diretório do projeto
No terminal da sua máquina virtual, entre na pasta raiz do seu projeto (**EXCELLPROCESSADOR**):
```bash
cd EXCELLPROCESSADOR
```

### 2. Inicialize o repositório Git local
Caso o projeto ainda não seja um repositório Git local, inicialize-o:
```bash
git init
```

### 3. Configure suas credenciais Git
Informe ao Git quem você é, utilizando os dados fornecidos:
```bash
git config --global user.email "marcioluizintra@gmail.com"
git config --global user.name "marcioluizintra"
```
Essas configurações globais garantem que seus commits sejam associados à sua conta correta.

### 4. Adicione os arquivos do projeto para o "staging area"
Adicione todos os arquivos do seu projeto ao índice do Git (staging area) para o próximo commit:
```bash
git add .
```
O ponto (.) adiciona todos os arquivos e pastas, incluindo subdiretórios.

### 5. Confirme (commit) as alterações
Crie o primeiro commit com uma mensagem descritiva:
```bash
git commit -m "Primeiro commit do projeto EXCELLPROCESSADOR"
```

### 6. Conecte o repositório local ao repositório remoto no GitHub
Adicione o URL do seu repositório GitHub como um controle remoto. O nome padrão para o remoto é **origin**:
```bash
git remote add origin https://github.com/marcioluizintra/marciointra-repositorio.github.io.git
```
Este comando vincula seu projeto local ao destino final no GitHub.

### 7. Envie (push) o projeto para o GitHub
Finalmente, envie seus commits locais para o repositório remoto na branch principal (comumente chamada **main** ou **master**):
```bash
git push -u origin main
```
Nota: A branch padrão no GitHub agora é frequentemente **main**. Se o seu repositório remoto usa **master**, substitua **main** por **master**. O parâmetro `-u` define o origin como upstream padrão, facilitando pushes e pulls futuros.

### 8. Autenticação (se necessário)
Ao executar o `git push`, o terminal pedirá seu nome de usuário (**marcioluizintra**) e senha. Neste ponto, você deve usar seu **Personal Access Token (PAT)** em vez da sua senha da conta Google.

Se você ainda não tem um PAT, precisará gerar um nas configurações de desenvolvedor do GitHub antes de prosseguir.

Após a autenticação bem-sucedida, seus arquivos estarão disponíveis no repositório **marciointra-repositorio.github.io** no GitHub.



Passo a Passo
1. Criar um Repositório no GitHub 
Você precisa de um local no GitHub para armazenar os arquivos do seu site. 
No canto superior direito de qualquer página do GitHub, clique no sinal de + e selecione New repository (Novo repositório).
Nome do repositório: Para um site de usuário ou organização, o nome do repositório deve ser seu_nome_de_usuário.github.io (substitua seu_nome_de_usuário pelo seu nome de usuário real do GitHub). Para um site de projeto, o nome pode ser qualquer um.
Visibilidade: Escolha Public (Público), pois sites privados exigem uma assinatura paga para usar o GitHub Pages.
Marque a opção Add a README file (Adicionar um arquivo README).
Clique em Create repository (Criar repositório). 
2. Carregar Seus Arquivos
Você pode carregar seus arquivos de duas maneiras:
Via interface web: Na página principal do seu novo repositório no GitHub, clique em Add file (Adicionar arquivo) e depois em Upload files (Carregar arquivos). Arraste e solte os arquivos do seu site para a área indicada. Certifique-se de que seu arquivo principal se chame index.html.
Via Git (linha de comando): Clone o repositório para sua máquina local usando git clone <URL_do_repositório>, adicione seus arquivos ao diretório local, e use git add ., git commit -m "Initial commit" e git push origin main para enviar os arquivos. 
3. Habilitar o GitHub Pages
Após carregar os arquivos, você precisa ativar o serviço:
Na página do seu repositório, clique na aba Settings (Configurações).
Na barra lateral esquerda, na seção "Code and automation", clique em Pages.
Em "Build and deployment", na seção "Source", selecione a opção Deploy from a branch (Fazer deploy a partir de um branch).
Abaixo, em "Branch", use o menu suspenso para selecionar o branch principal (geralmente main ou master) e a pasta raiz (geralmente /root).
Clique em Save (Salvar). 
4. Acessar Seu Site
Seu site estará acessível em https://seu_nome_de_usuário.github.io/ (para sites de usuário) ou https://seu_nome_de_usuário.github.io/nome_do_repositorio/ (para sites de projeto). 
Pode levar alguns minutos (até 10 minutos) para que o site seja publicado pela primeira vez. 
Dicas Adicionais
Domínio Personalizado: Você pode configurar seu próprio domínio, como www.meusite.com, nas configurações de Pages do seu repositório, configurando os registros DNS necessários no seu provedor de domínio.
Limites: O GitHub Pages é ótimo para sites estáticos, mas possui limites de uso, como tamanho máximo de 1 GB e largura de banda flexível de 100 GB por mês. 


