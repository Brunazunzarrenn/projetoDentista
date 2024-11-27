// Rota para consultar cheques por data de vencimento
router.get('/buscar-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Data de vencimento é necessária' });
    }

    const query = 'SELECT * FROM cheques WHERE data_vencimento = ?';
    db.query(query, [dataVencimento], (err, results) => {
        if (err) {
            console.error('Erro ao consultar cheques:', err);
            return res.status(500).json({ error: 'Erro ao consultar cheques' });
        }

        res.json(results);
    });
});