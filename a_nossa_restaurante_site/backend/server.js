const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const produtosRouter = require('./rotas/produtos');
const pedidosRouter = require('./rotas/pedidos');

app.use('/api/produtos', produtosRouter);
app.use('/api/pedidos', pedidosRouter);

app.get('/', (req, res) => {
  res.json({ message: 'API A Nossa Restaurante rodando com sucesso.', version: '1.0.0' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
