const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let historicoUmidade = [];
let statusBomba = false;

// ESP32 envia dados
app.post("/dados", (req, res) => {
  const { umidade } = req.body;
  const registro = { 
    umidade, 
    tempo: new Date().toISOString()
  };
  historicoUmidade.push(registro);

  // Mantém apenas últimas 24h
  const limite = Date.now() - 24 * 60 * 60 * 1000;
  historicoUmidade = historicoUmidade.filter(r => new Date(r.tempo).getTime() > limite);

  console.log("Umidade recebida:", umidade);
  res.send("OK");
});

// Frontend busca histórico
app.get("/umidade", (req, res) => {
  res.json({ historico: historicoUmidade, bomba: statusBomba });
});

// Controle da bomba
app.post("/bomba", (req, res) => {
  statusBomba = req.body.ligar;
  console.log("Bomba:", statusBomba ? "Ligada" : "Desligada");
  res.send("Status atualizado");
});

// Exportar CSV
app.get("/exportar", (req, res) => {
  let csv = "tempo,umidade\n";
  historicoUmidade.forEach(r => {
    csv += `${r.tempo},${r.umidade}\n`;
  });

  const filePath = path.join(__dirname, "historico_umidade.csv");
  fs.writeFileSync(filePath, csv);

  res.download(filePath, "historico_umidade.csv");
});

// Servir frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
