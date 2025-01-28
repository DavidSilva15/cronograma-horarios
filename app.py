import subprocess
import webbrowser
import time

# Caminho para o arquivo server.js
server_file = "app.js"

# Comando para rodar o servidor Node.js
start_server_cmd = ["node", server_file]

# Configuração do navegador Edge
# Ajuste o caminho do executável do Edge, se necessário
edge_path = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
webbrowser.register('edge', None, webbrowser.BackgroundBrowser(edge_path))

try:
    # Inicia o servidor em um subprocesso
    server_process = subprocess.Popen(start_server_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("Servidor iniciado no arquivo server.js na porta 3080.")

    # Aguarda alguns segundos para garantir que o servidor está funcionando
    time.sleep(3)

    # URL a ser aberta no navegador
    url = "http://localhost:3080/"

    # Abre o navegador Microsoft Edge
    print(f"Abrindo o navegador Edge em {url}")
    webbrowser.get('edge').open(url)

    # Mantém o servidor rodando
    print("Pressione Ctrl+C para encerrar o servidor.")
    server_process.wait()

except FileNotFoundError as e:
    print(f"Erro: {e}\nCertifique-se de que o Node.js está instalado e que o caminho para o arquivo server.js está correto.")

except KeyboardInterrupt:
    print("\nEncerrando o servidor...")
    server_process.terminate()

finally:
    if server_process.poll() is None:
        server_process.terminate()
        print("Servidor encerrado.")