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
