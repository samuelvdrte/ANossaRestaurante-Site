const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "dados", "pedidos.json");

function lerPedidos() {
    return JSON.parse(fs.readFileSync(arquivo, "utf8"));
}
function salvarPedidos(pedidos) {
    fs.writeFileSync(arquivo, JSON.stringify(pedidos, null, 2), "utf8");
}

router.get("/", (req, res) => {
    res.json(lerPedidos());
});

router.post("/", (req, res) => {
    const { clientName, address, payment, items, total, observations = "" } = req.body;
    if (!clientName || !address || !payment || !Array.isArray(items) || total === undefined) {
        return res.status(400).json({ erro: "Dados obrigatórios do pedido não informados." });
    }
    const pedidos = lerPedidos();
    const pedido = {
        id: Date.now(),
        date: new Date().toISOString(),
        clientName,
        address,
        payment,
        items,
        total: Number(total),
        observations
    };
    pedidos.unshift(pedido);
    salvarPedidos(pedidos);
    res.status(201).json(pedido);
});

module.exports = router;
