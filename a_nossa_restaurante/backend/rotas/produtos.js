const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const arquivo = path.join(__dirname, "..", "dados", "produtos.json");

function lerProdutos() {
    return JSON.parse(fs.readFileSync(arquivo, "utf8"));
}
function salvarProdutos(produtos) {
    fs.writeFileSync(arquivo, JSON.stringify(produtos, null, 2), "utf8");
}

router.get("/", (req, res) => {
    res.json(lerProdutos());
});

router.get("/:id", (req, res) => {
    const produto = lerProdutos().find(p => String(p.id) === req.params.id);
    if (!produto) return res.status(404).json({ erro: "Produto não encontrado." });
    res.json(produto);
});

router.post("/", (req, res) => {
    const { name, description, price, category, image, available = true } = req.body;
    if (!name || !description || price === undefined || !category) {
        return res.status(400).json({ erro: "Informe nome, descrição, preço e categoria." });
    }
    const produtos = lerProdutos();
    const novo = {
        id: Date.now(),
        name: String(name),
        description: String(description),
        price: Number(price),
        category: String(category),
        image: String(image || ""),
        available: Boolean(available)
    };
    produtos.push(novo);
    salvarProdutos(produtos);
    res.status(201).json(novo);
});

router.put("/:id", (req, res) => {
    const produtos = lerProdutos();
    const indice = produtos.findIndex(p => String(p.id) === req.params.id);
    if (indice === -1) return res.status(404).json({ erro: "Produto não encontrado." });
    produtos[indice] = { ...produtos[indice], ...req.body, id: produtos[indice].id };
    salvarProdutos(produtos);
    res.json(produtos[indice]);
});

router.delete("/:id", (req, res) => {
    const produtos = lerProdutos();
    const filtrados = produtos.filter(p => String(p.id) !== req.params.id);
    if (filtrados.length === produtos.length) {
        return res.status(404).json({ erro: "Produto não encontrado." });
    }
    salvarProdutos(filtrados);
    res.json({ mensagem: "Produto excluído com sucesso." });
});

module.exports = router;
