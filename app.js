const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = 3080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// Configuração do banco de dados
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "crud_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Conectado ao banco de dados!");
});

// Criar uma nova tarefa
app.post("/tasks", (req, res) => {
  const { tema, data, horario, assunto, status } = req.body;

  // Extrair o dia da data
  const dia = new Date(data).toLocaleDateString("pt-BR", { weekday: "long" });

  // Verificar se já existe uma tarefa com a mesma data e horário
  const checkSql = "SELECT * FROM tasks WHERE data = ? AND horario = ?";
  db.query(checkSql, [data, horario], (err, result) => {
    if (err) {
      console.error("Erro ao verificar tarefas existentes:", err);
      return res.status(500).send();
    }

    // Se já houver agendamento no mesmo horário, retorna sem resposta
    if (result.length > 0) {
      return res.status(200).send(); // Sem corpo na resposta
    }

    // Caso contrário, insere a nova tarefa
    const sql = "INSERT INTO tasks (tema, data, dia, horario, assunto, status) VALUES (?, ?, ?, ?, ?, ?)";
    db.query(sql, [tema, data, dia, horario, assunto, status || "Pendente"], (err, result) => {
      if (err) {
        console.error("Erro ao inserir a tarefa:", err);
        return res.status(500).send();
      }

      // Responde com status 201 sem corpo
      res.status(201).send(); // Tarefa criada com sucesso, sem mensagem
    });
  });
});



// Obter todas as tarefas
app.get("/tasks", (req, res) => {
  const sql = "SELECT * FROM tasks";
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.send(results);
  });
});

// Editar uma tarefa
app.put("/tasks/edit/:id", (req, res) => {
  const { id } = req.params;
  const { tema, data, horario, assunto } = req.body;

  // Extrair o dia da data
  const dia = new Date(data).toLocaleDateString("pt-BR", { weekday: "long" });

  // Verificar se já existe outra tarefa no mesmo dia e horário
  const checkSql = `SELECT * FROM tasks WHERE data = ? AND horario = ? AND id != ?`;
  db.query(checkSql, [data, horario, id], (err, result) => {
      if (err) throw err;

      // Se já houver conflito, retorna um erro
      if (result.length > 0) {
          return res.status(400).send({
              message: `O horário ${horario} no dia ${dia} já está ocupado por outra tarefa.`,
              error: true,
          });
      }

      // Atualizar a tarefa se não houver conflitos
      const updateSql = `
          UPDATE tasks 
          SET tema = ?, data = ?, dia = ?, horario = ?, assunto = ? 
          WHERE id = ?`;
      db.query(updateSql, [tema, data, dia, horario, assunto, id], (err, result) => {
          if (err) throw err;
          res.send({ message: "Tarefa atualizada com sucesso!" });
      });
  });
});


// Atualizar o status de uma tarefa
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = "UPDATE tasks SET status = ? WHERE id = ?";
  db.query(sql, [status, id], (err, result) => {
    if (err) throw err;
    res.send({ message: "Tarefa atualizada com sucesso!" });
  });
});

// Excluir uma tarefa
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tasks WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.send({ message: "Tarefa excluída com sucesso!" });
  });
});

// Iniciar o servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});