const API_URL = "/tasks";
const tableBody = document.getElementById("tableBody");

// Função para buscar e exibir tarefas com filtros
async function fetchTasks() {
    // Obter os valores dos filtros
    const temaFilter = document.getElementById("temaFilter").value.toLowerCase();
    const dataStartFilter = document.getElementById("dataStartFilter").value;
    const dataEndFilter = document.getElementById("dataEndFilter").value;
    const diaFilter = document.getElementById("diaFilter").value.toLowerCase();

    // Buscar todas as tarefas da API
    const response = await fetch(API_URL);
    const tasks = await response.json();

    // Aplicar filtros no lado do cliente
    const filteredTasks = tasks.filter((task) => {
        const taskDate = new Date(task.data);
        const taskDia = new Date(task.data).toLocaleDateString("pt-BR", { weekday: "long" }).toLowerCase();  // Calcular o dia correto

        // Filtrar pelo tema
        const isTemaMatch = temaFilter ? task.tema.toLowerCase().includes(temaFilter) : true;

        // Filtrar pela data (intervalo)
        const isDateInRange =
            (!dataStartFilter || taskDate >= new Date(dataStartFilter)) &&
            (!dataEndFilter || taskDate <= new Date(dataEndFilter + 'T23:59:59'));

        // Filtrar pelo dia
        const isDiaMatch = diaFilter ? taskDia.includes(diaFilter) : true;

        return isTemaMatch && isDateInRange && isDiaMatch;
    });

    // Limpar a tabela
    tableBody.innerHTML = "";

    // Exibir as tarefas filtradas
    filteredTasks.forEach((task) => {
        const taskDate = new Date(task.data);  // Obter a data para formatar corretamente
        const formattedDate = taskDate.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });

        const taskDia = taskDate.toLocaleDateString("pt-BR", { weekday: "long" });

        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="text-center">${task.tema}</td>
            <td class="text-center">${formattedDate}</td>
            <td class="text-center">${taskDia}</td>  <!-- Exibindo o dia da semana calculado -->
            <td class="text-center">${task.horario}</td>
            <td class="text-center">${task.assunto}</td>
            <td class="text-center ${task.status === 'Concluída' ? 'text-success' : 'text-warning'}">
                <i class="fa ${task.status === 'Concluída' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i>
                ${task.status}
            </td>
            <td class="text-center">
                <button class="btn btn-success btn-sm" onclick="markAsCompleted(${task.id})">
                    <i class="fa fa-check"></i> 
                </button>
                <button class="btn btn-primary btn-sm" onclick="openEditModal(${task.id})">
                    <i class="fa fa-edit"></i> 
                </button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteConfirmationModal(${task.id})">
                    <i class="fa fa-trash"></i> 
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

document.getElementById("confirmDeleteButton").addEventListener("click", confirmDeleteTask);

// Função para limpar os filtros
function clearFilters() {
    // Limpar os valores dos campos de filtro
    document.getElementById("temaFilter").value = "";
    document.getElementById("dataStartFilter").value = "";
    document.getElementById("dataEndFilter").value = "";
    document.getElementById("diaFilter").value = "";

    // Atualizar a lista de tarefas sem filtros
    fetchTasks();
}

// Função para verificar se o horário está ocupado
async function isHorarioOcupado(dia, horario) {
    const response = await fetch(API_URL);
    const tasks = await response.json();

    // Verifica se existe alguma tarefa no mesmo dia e horário
    return tasks.some((task) => task.dia === dia && task.horario === horario);
}

document.getElementById("crudForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("crudForm").getAttribute("data-task-id");
    const tema = document.getElementById("tema").value;
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    const assunto = document.getElementById("assunto").value;
    const dia = new Date(data).toLocaleDateString("pt-BR", { weekday: "long" });

    try {
        let response;

        // Verifica duplicidade de horário antes de continuar
        if (!id && await isHorarioOcupado(dia, horario, id)) {
            // Se já houver duplicidade, retorna sem exibir erro
            return;
        }

        // Se houver id, significa que a tarefa será editada
        if (id) {
            // Atualizar tarefa existente
            response = await fetch(`${API_URL}/edit/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tema, data, dia, horario, assunto }),
            });
        } else {
            // Criar nova tarefa
            response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tema, data, dia, horario, assunto }),
            });
        }

        if (response.ok) {
            // Atualiza a lista de tarefas e limpa o formulário
            fetchTasks();
            document.getElementById("crudForm").reset();
            bootstrap.Modal.getInstance(document.getElementById("addModal")).hide();
        }

    } catch (error) {
        console.error("Erro ao salvar a tarefa", error);
    }
});

// Função para abrir o modal de adição (Nova Tarefa)
function openAddModal() {
    // Limpa o formulário
    document.getElementById("crudForm").reset();

    // Remove o ID da tarefa do formulário
    document.getElementById("crudForm").removeAttribute("data-task-id");

    // Exibe o modal de adição
    const modal = new bootstrap.Modal(document.getElementById("addModal"));
    modal.show();
}


// Função para exibir o modal de alerta
function showAlertModal(message) {
    const alertMessage = document.getElementById("alertMessage");
    alertMessage.textContent = message; // Atualiza a mensagem do alerta

    const alertModal = new bootstrap.Modal(document.getElementById("alertModal"));
    alertModal.show(); // Exibe o modal de alerta
}

// Função para concluir tarefa
async function markAsCompleted(id) {
    await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Concluída" }),
    });
    fetchTasks();
}

// Função para abrir o modal de edição
async function openEditModal(id) {
    const response = await fetch(API_URL);
    const tasks = await response.json();
    const task = tasks.find((t) => t.id === id);

    // Preenche os campos do modal com os valores da tarefa
    document.getElementById("tema").value = task.tema;

    // Formatar a data para o formato YYYY-MM-DD
    const formattedDate = new Date(task.data).toISOString().split('T')[0];
    document.getElementById("data").value = formattedDate; // A data deve estar no formato correto

    document.getElementById("horario").value = task.horario;
    document.getElementById("assunto").value = task.assunto;

    // Define o ID da tarefa para edição
    document.getElementById("crudForm").setAttribute("data-task-id", id);

    // Exibe o modal
    const modal = new bootstrap.Modal(document.getElementById("addModal"));
    modal.show();
}

// Função para verificar se o horário está ocupado
async function isHorarioOcupado(dia, horario, id) {
    const response = await fetch(API_URL);
    const tasks = await response.json();

    // Verifica se existe alguma tarefa no mesmo dia e horário, excluindo a tarefa atual (se existir)
    return tasks.some((task) => task.dia === dia && task.horario === horario && task.id !== id);
}

// Função para salvar a tarefa (criação ou edição)
async function saveTask(event) {
    event.preventDefault(); // Impede o comportamento padrão de submit do formulário

    // Pega os dados do formulário
    const tema = document.getElementById("tema").value;
    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    const assunto = document.getElementById("assunto").value;
    const id = document.getElementById("crudForm").getAttribute("data-task-id");

    // Se id estiver presente, é uma edição, caso contrário, é uma criação
    const url = id ? `${API_URL}/edit/${id}` : API_URL;

    // Faz a requisição de criação ou edição
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema, data, horario, assunto })
    });

    if (response.ok) {
        // Exibe o modal de sucesso com a mensagem
        showAlertModal(id ? "Tarefa atualizada com sucesso!" : "Tarefa criada com sucesso!");
        fetchTasks(); // Atualiza a lista de tarefas
        const modal = bootstrap.Modal.getInstance(document.getElementById("addModal"));
        modal.hide(); // Fechar o modal após salvar
    } else {
        const error = await response.json();
        // Exibe o modal de erro com a mensagem
        showAlertModal(`Erro ao salvar tarefa: ${error.message}`);
    }
}

// Ouve o evento de fechamento de qualquer modal
const modals = document.querySelectorAll('.modal');
modals.forEach(modal => {
    modal.addEventListener('hidden.bs.modal', function () {
        // Remove o overlay quando qualquer modal for fechado
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    });
});

// Adicionar o evento de submit no formulário
document.getElementById("crudForm").addEventListener("submit", saveTask);



// Função para deletar tarefa
/*async function deleteTask(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchTasks();
}*/

let taskIdToDelete = null; // Variável global para armazenar o ID da tarefa a ser excluída

// Função para abrir o modal de confirmação de exclusão
function openDeleteConfirmationModal(id) {
    taskIdToDelete = id; // Armazena o ID da tarefa a ser excluída
    const modal = new bootstrap.Modal(document.getElementById("confirmationModal"));
    modal.show();
}

// Função para confirmar a exclusão
async function confirmDeleteTask() {
    if (taskIdToDelete !== null) {
        await fetch(`${API_URL}/${taskIdToDelete}`, { method: "DELETE" });
        fetchTasks(); // Atualiza a lista de tarefas após a exclusão
        taskIdToDelete = null; // Limpa o ID da tarefa
    }
    // Fecha o modal de confirmação
    const modal = bootstrap.Modal.getInstance(document.getElementById("confirmationModal"));
    modal.hide();
}


// Função para exportar para Excel com cabeçalho em negrito, remoção dos botões e data no nome do arquivo
function exportToExcel() {
    const table = document.getElementById('tasksTable'); // A tabela com o id "tasksTable"
    
    // Converte a tabela HTML para um livro de trabalho
    const wb = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
    
    // Obter a planilha criada
    const ws = wb.Sheets.Sheet1;

    // Definir a primeira linha como cabeçalho e estilizar com negrito
    const range = ws["!rows"] || [];
    
    // Para garantir que o cabeçalho (primeira linha) esteja em negrito
    for (let i = 0; i < 7; i++) { // Aqui é o número de colunas que o cabeçalho possui
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: i })];
        if (cell) {
            cell.s = { font: { bold: true } }; // Aplica o estilo negrito
        }
    }

    // Remover a coluna de botões de ação (última coluna da tabela)
    const rows = Array.from(table.querySelectorAll('tr'));
    const filteredRows = rows.map(row => {
        const cells = Array.from(row.children);
        cells.pop();  // Remove a última coluna (que são os botões de ação)
        return cells.map(cell => cell.innerText);  // Retorna apenas o conteúdo textual
    });

    // Converter as linhas filtradas para uma planilha
    const wsFiltered = XLSX.utils.aoa_to_sheet(filteredRows);
    wb.Sheets.Sheet1 = wsFiltered;

    // Obter a data atual no formato dd-MM-yyyy
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("pt-BR").split("/").reverse().join("-");

    // Gerar o nome do arquivo com a data
    const fileName = `relatorio_${formattedDate}.xlsx`;

    // Exporta o arquivo Excel com o nome contendo a data
    XLSX.writeFile(wb, fileName);
}

// Função para exportar para PDF com tabela formatada e data no nome do arquivo
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Adiciona título do PDF
    doc.text("Cronograma", 14, 10);

    // Obtém os dados da tabela
    const table = document.getElementById("tasksTable"); // Tabela completa com o id 'tasksTable'
    const rows = Array.from(table.querySelectorAll("tr"));

    // Prepara as colunas da tabela
    const columns = [
        "Tema", "Data", "Dia", "Horário", "Assunto", "Status"
    ];

    // Cria uma matriz de dados para preencher a tabela
    const data = rows.slice(1).map((row) => {
        const cells = Array.from(row.children);
        return cells.slice(0, 6).map((cell) => cell.innerText); // Ignora a coluna de botões de ação
    });

    // Cria a tabela no PDF
    doc.autoTable({
        head: [columns],
        body: data,
        startY: 20,
        theme: 'grid',
    });

    // Obter a data atual para nome do arquivo
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("pt-BR").split("/").reverse().join("-");

    // Exporta o PDF com a data no nome do arquivo
    doc.save(`relatorio_${formattedDate}.pdf`);
}

// Função para importar tarefas de um arquivo CSV
function importCSV(event) {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const lines = content.split("\n");
            const tasks = lines.map(line => {
                const [tema, data, dia, horario, assunto] = line.split(",");
                return { tema, data, dia, horario, assunto };
            });

            // Enviar as tarefas para a API (adicionar ao banco de dados)
            for (const task of tasks) {
                await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(task),
                });
            }

            // Atualizar a tabela após importação
            fetchTasks();
        };
        reader.readAsText(file);
    } else {
        alert("Por favor, selecione um arquivo CSV válido.");
    }
}

// Chama a função para mostrar as tarefas ao carregar a página
fetchTasks();