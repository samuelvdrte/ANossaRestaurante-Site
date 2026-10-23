const express = require("express");
const cors = require("cors");
const produtosRouter = require("./rotas/produtos");
const pedidosRouter = require("./rotas/pedidos");

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend da A Nossa Restaurante funcionando!");
});

app.use("/api/produtos", produtosRouter);
app.use("/api/pedidos", pedidosRouter);

app.listen(PORTA, () => {
    console.log(`Backend funcionando em http://localhost:${PORTA}`);
});
