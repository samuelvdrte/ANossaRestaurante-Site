const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../dados/produtos.json');

function readProducts() {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
}

function writeProducts(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

router.get('/', (req, res) => {
    try {
        const produtos = readProducts();
        res.json(produtos);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao ler a lista de produtos.' });
    }
});

router.post('/', (req, res) => {
    try {
        const produtos = readProducts();
        const novoProduto = { id: Date.now(), ...req.body };
        produtos.push(novoProduto);
        writeProducts(produtos);
        res.status(201).json(novoProduto);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao cadastrar produto.' });
    }
});

router.put('/:id', (req, res) => {
    try {
        let produtos = readProducts();
        const id = parseInt(req.params.id);
        produtos = produtos.map(p => p.id === id ? { ...p, ...req.body, id } : p);
        writeProducts(produtos);
        res.json({ success: true, message: 'Produto atualizado com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar produto.' });
    }
});

router.delete('/:id', (req, res) => {
    try {
        let produtos = readProducts();
        const id = parseInt(req.params.id);
        produtos = produtos.filter(p => p.id !== id);
        writeProducts(produtos);
        res.json({ success: true, message: 'Produto removido com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao remover produto.' });
    }
});

module.exports = router;
