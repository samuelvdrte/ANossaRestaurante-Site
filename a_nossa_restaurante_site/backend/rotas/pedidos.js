const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../dados/pedidos.json');

function readOrders() {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
}

function writeOrders(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

router.get('/', (req, res) => {
    try {
        const pedidos = readOrders();
        res.json(pedidos);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao obter histórico de pedidos.' });
    }
});

router.post('/', (req, res) => {
    try {
        const pedidos = readOrders();
        const novoPedido = { id: Date.now(), ...req.body };
        pedidos.unshift(novoPedido);
        writeOrders(pedidos);
        res.status(201).json(novoPedido);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao registrar pedido.' });
    }
});

module.exports = router;
