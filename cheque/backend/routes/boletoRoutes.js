// Rota para consultar boletos por data de vencimento
router.get('/buscar-por-vencimento', (req, res) => {
    const { dataVencimento } = req.query;

    if (!dataVencimento) {
        return res.status(400).json({ error: 'Data de vencimento é necessária' });
    }

    const query = 'SELECT * FROM boletos WHERE data_vencimento = ?';
    db.query(query, [dataVencimento], (err, results) => {
        if (err) {
            console.error('Erro ao consultar boletos:', err);
            return res.status(500).json({ error: 'Erro ao consultar boletos' });
        }

        res.json(results);
    });
});