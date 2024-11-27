const express = require('express');
    const bodyParser = require('body-parser');
    const db = require('./db/connection');  // Certifique-se de que o caminho para o banco de dados está correto
    const path = require('path');
    const cors = require('cors');
    const chequeRoutes = require('./routes/cheque');
     



    const app = express();
    const PORT = 5001;

    app.use(cors());
    app.use(express.json());

    app.use(bodyParser.json());
    app.use(express.static(path.join(__dirname, 'frontend')));
    app.use('/api', chequeRoutes); // Rota para as APIs de cheques
    

    
    // Rota para cadastrar um cheque
    app.post('/api/cheques/cadastrocheque', (req, res) => {
        const { cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa } = req.body;
    
        if (!cheque_numero || !data_emissao || !nome_beneficiario || !valor || !data_vencimento || !empresa) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }
    
        const sql = `INSERT INTO cheques (cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
        const values = [cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, descricao, empresa];
    
        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Erro ao salvar cheque:', err);
                return res.status(500).json({ error: 'Erro ao salvar cheque no banco de dados.' });
            }
            res.status(200).json({ message: 'Cheque cadastrado com sucesso!' });
        });
    });
    


    // Rota para buscar próximos cheques a vencer (a partir de hoje)
    app.get('/api/cheques/proximos', (req, res) => {
        const sql = `
            SELECT cheque_numero, data_emissao, nome_beneficiario, valor, data_vencimento, empresa, 
                   CASE 
                       WHEN data_vencimento < CURDATE() THEN 'Atrasado'
                       WHEN data_vencimento = CURDATE() THEN 'Vence Hoje'
                       ELSE 'Pendente'
                   END AS status
            FROM cheques
            WHERE data_vencimento >= CURDATE()
            ORDER BY data_vencimento ASC
        `;
    
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Erro ao buscar cheques próximos ao vencimento:', err);
                return res.status(500).json({ error: 'Erro ao buscar cheques próximos ao vencimento' });
            }
            console.log("Cheques próximos ao vencimento encontrados:", results); // Log de depuração
            res.json(results);
        });
    });
    
    

    app.get('/ping', (req, res) => {
        res.send('Servidor está funcionando');
    });

    // Coloque o restante das rotas aqui

    // Rota para buscar um produto específico pelo ID ou Nome
    app.get('/api/produtos/:idOrNome', (req, res) => {
        const { idOrNome } = req.params;

        let sql = '';
        let values = [];

        // Verifica se o parâmetro é um número (ID) ou um texto (Nome)
        if (isNaN(idOrNome)) {
            // Se for texto, pesquisa pelo nome do produto
            sql = 'SELECT * FROM produtos WHERE nome = ?';
            values = [idOrNome];
        } else {
            // Se for um número, pesquisa pelo ID do produto
            sql = 'SELECT * FROM produtos WHERE id = ?';
            values = [parseInt(idOrNome)];
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao buscar produto:', err);
                res.status(500).json({ error: 'Erro ao buscar produto' });
                return;
            }

            if (results.length > 0) {
                res.json(results[0]);  // Retorna o primeiro produto encontrado
            } else {
                res.status(404).json({ message: 'Produto não encontrado' });
            }
        });
    });

    // Rota para listar todos os produtos no estoque
    
// Carrega os produtos ao iniciar a página
    app.get('/api/produtos', (req, res) => {
        console.log('Rota /api/produtos foi chamada'); // Verificação

        const sql = 'SELECT * FROM produtos';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Erro ao buscar produtos:', err);
                res.status(500).json({ error: 'Erro ao buscar produtos' });
                return;
            }
            res.json(results); // Retorna todos os produtos encontrados
        });
    });

    app.post('/api/produtos', (req, res) => {
        const { nome, descricao, quantidade, preco } = req.body;
    
        // Verifica se os campos obrigatórios foram preenchidos
        if (!nome || !quantidade || !preco) {
            return res.status(400).json({ error: 'Os campos Nome, Quantidade e Preço são obrigatórios.' });
        }
    
        // Insere o produto no banco de dados
        const sql = `
            INSERT INTO produtos (nome, descricao, quantidade, preco, data_cadastro) 
            VALUES (?, ?, ?, ?, NOW())
        `;
        const values = [nome, descricao, quantidade, preco];
    
        db.query(sql, values, (err, results) => {
            if (err) {
                console.error('Erro ao cadastrar produto:', err);
                res.status(500).json({ error: 'Erro ao cadastrar produto.' });
                return;
            }
            res.status(201).json({ message: 'Produto cadastrado com sucesso!' });
        });
    });
    


    app.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);

    });

    // Rota para buscar cheques por data

    app.get('/api/cheques/buscar-por-vencimento', (req, res) => {
        const { dataVencimento } = req.query;
    
        if (!dataVencimento) {
            return res.status(400).json({ error: 'Data de vencimento é necessária' });
        }
    
        const sql = "SELECT * FROM cheques WHERE data_vencimento = ?";
        db.query(sql, [dataVencimento], (err, results) => {
            if (err) {
                console.error('Erro ao consultar cheques:', err);
                res.status(500).json({ error: 'Erro ao consultar cheques' });
                return;
            }
            res.json(results);
        });
    });
    

   app.get('/api/cheques/relatorio', (req, res) => {
    const { dataInicio, dataFim } = req.query;

    const sql = `
        SELECT cheque_numero, nome_beneficiario, data_emissao, data_vencimento, valor, status
        FROM cheques
        WHERE data_emissao BETWEEN ? AND ?
    `;

    const values = [dataInicio, dataFim];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao buscar relatório de cheques:', err);
            res.status(500).json({ error: 'Erro ao buscar relatório de cheques' });
            return;
        }

        // Não sobrescreva o status que já vem do banco de dados
        const chequesComStatus = results.map((cheque) => ({
            ...cheque,
            status: cheque.status, // Status real do banco
        }));

        console.log('Resultados encontrados:', chequesComStatus); // Log de depuração
        res.json(chequesComStatus);
    });
});

    
    
    /* ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
    const boletoRoutes = require('./routes/boleto');  // Certifique-se de que o arquivo de rotas de cheque está configurado corretamente
    app.use('/api', boletoRoutes);

    
    // Rota para cadastrar um boleto
// Rota para cadastrar um boleto
app.post('/api/boletos/cadastroboleto', (req, res) => {
    const { nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao } = req.body;

    // Verifica se a data de vencimento é anterior ao dia de hoje
    const dataVencimento = new Date(data_vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera as horas, minutos, segundos e milissegundos para a comparação apenas por data

    // Verifica se a data de emissão é posterior à data de vencimento
    if (new Date(data_emissao) > dataVencimento) {
        return res.status(400).json({ error: 'A data de emissão não pode ser posterior à data de vencimento.' });
    }

    // Define o status do boleto
    let status = "pendente";
    if (dataVencimento < hoje) {
        status = "atrasado";
    }

    // Adiciona o status na consulta SQL e nos valores
    const sql = 'INSERT INTO boletos (nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [nome_pagador, cpf_pagador, endereco_pagador, valor, data_emissao, data_vencimento, descricao, status];

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Erro ao cadastrar boleto:', err);
            res.status(500).json({ error: 'Erro ao cadastrar boleto' });
            return;
        }
        res.status(201).json({ message: 'Boleto cadastrado com sucesso!' });
    });
});


// Rota para buscar próximos boletos a vencer (a partir de hoje)
app.get('/api/boletos/proximos-boletos', (req, res) => {
    const sql = `
        SELECT * FROM boletos 
        WHERE data_vencimento = CURDATE() 
        OR data_vencimento = CURDATE() + INTERVAL 1 DAY
        ORDER BY data_vencimento ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar boletos próximos ao vencimento:', err);
            res.status(500).json({ error: 'Erro ao buscar boletos próximos ao vencimento' });
            return;
        }
        res.json(results);
    });
});

app.get('/api/boletos/buscar-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Data de vencimento é necessária' });
    }

    // Consulta ao banco de dados para buscar os boletos pela data de vencimento
    const query = "SELECT * FROM boletos WHERE data_vencimento = ?";
    db.query(query, [dataVencimento], (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos' });
        }

        // Retorna os resultados para o frontend
        res.json(results);
    });
});


// Rota para checar se o servidor está online
app.get('/ping', (req, res) => {
    res.send('Servidor está funcionando');
});


// Serve arquivos estáticos do diretório 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota padrão para carregar o arquivo principal (index.html ou cadastro.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/cadastro.html'));
});


// CHEQUE COMPENSADO
// Rota para marcar um cheque como compensado
app.patch('/api/cheques/compensar/:cheque_numero', (req, res) => {
    const chequeNumero = req.params.cheque_numero; // Use o número do cheque em vez do ID
    console.log("Cheque número recebido para compensação:", chequeNumero);

    const sql = `
        UPDATE cheques 
        SET status = 'Compensado' 
        WHERE cheque_numero = ?
    `;

    db.query(sql, [chequeNumero], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar status do cheque:', err);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar status do cheque' });
        }

        if (results.affectedRows > 0) {
            res.json({ success: true, message: 'Cheque marcado como compensado' });
        } else {
            res.status(404).json({ success: false, message: 'Cheque não encontrado' });
        }
    });
});



module.exports = app;