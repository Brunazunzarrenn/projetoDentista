document.addEventListener('DOMContentLoaded', function () {
    console.log("Script inicializado.");

    // Identifica a página atual
    const bodyId = document.body.id;

    // Executa o código relevante para cada página
    if (bodyId === 'page-cadastro') {
        console.log("Página Cadastro detectada.");
        initCadastroCheque();
        carregarProximosCheques();
    } else if (bodyId === 'page-relatorio') {
        console.log("Página Relatório detectada.");
        initRelatorio();
    } else {
        console.warn("ID de página não reconhecido:", bodyId);
    }
});

// Inicializa o formulário de cadastro de cheques
function initCadastroCheque() {
    console.log("Página Cadastro de Cheques inicializada.");

    const chequeForm = document.getElementById('chequeForm');
    if (chequeForm) {
        chequeForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const chequeData = {
                cheque_numero: document.getElementById('cheque_numero').value,
                data_emissao: document.getElementById('data_emissao').value,
                nome_beneficiario: document.getElementById('nome_beneficiario').value,
                valor: parseFloat(document.getElementById('valor').value),
                data_vencimento: document.getElementById('data_vencimento').value,
                descricao: document.getElementById('descricao').value,
                empresa: document.getElementById('empresa').value
            };

            try {
                const response = await fetch('http://localhost:5002/api/cheques/cadastrocheque', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chequeData),
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message || 'Cheque cadastrado com sucesso!');
                    chequeForm.reset();
                    carregarProximosCheques(); // Atualiza os cheques após o cadastro
                } else {
                    alert(result.error || 'Erro ao cadastrar o cheque.');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    } else {
        console.warn("Formulário de cadastro de cheques não encontrado.");
    }
}

// Inicializa o relatório de cheques
function initRelatorio() {
    const relatorioForm = document.getElementById('relatorioForm');
    const resultadosDiv = document.getElementById('resultados');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (relatorioForm) {
        relatorioForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const dataInicio = document.getElementById('data_inicio').value;
            const dataFim = document.getElementById('data_fim').value;

            if (!dataInicio || !dataFim) {
                alert('Por favor, preencha as datas de início e fim.');
                return;
            }

            try {
                loadingSpinner.style.display = 'block';
                resultadosDiv.innerHTML = '';

                const response = await fetch(`http://localhost:5002/api/cheques/relatorio?dataInicio=${dataInicio}&dataFim=${dataFim}`);
                const cheques = await response.json();

                if (response.ok && cheques.length > 0) {
                    let tabelaHTML = `
                        <h3>Relatório de Cheques</h3>
                        <table>
                            <tr>
                                <th>Número</th>
                                <th>Beneficiário</th>
                                <th>Data de Emissão</th>
                                <th>Data de Vencimento</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                    `;

                    cheques.forEach(cheque => {
                        tabelaHTML += `
                            <tr>
                                <td>${cheque.cheque_numero}</td>
                                <td>${cheque.nome_beneficiario}</td>
                                <td>${formatarData(cheque.data_emissao)}</td>
                                <td>${formatarData(cheque.data_vencimento)}</td>
                                <td>R$ ${parseFloat(cheque.valor).toFixed(2).replace('.', ',')}</td>
                                <td>${cheque.status || 'Indefinido'}</td> <!-- Exibe 'Indefinido' se status estiver vazio -->
                            </tr>
                        `;
                    });
                    

                    tabelaHTML += '</table>';
                    resultadosDiv.innerHTML = tabelaHTML;

                } else {
                    resultadosDiv.innerHTML = '<p>Nenhum cheque encontrado para o período selecionado.</p>';
                }
            } catch (error) {
                console.error('Erro ao buscar relatório:', error);
                alert('Erro ao buscar relatório.');
            } finally {
                loadingSpinner.style.display = 'none';
            }
        });
    } else {
        console.warn("Formulário de relatório não encontrado.");
    }
}

// Carrega os próximos cheques a vencer
async function carregarProximosCheques() {
    try {
        const response = await fetch('http://localhost:5002/api/cheques/proximos');
        const cheques = await response.json();

        const proximoChequeDiv = document.getElementById('proximoCheque');
        proximoChequeDiv.innerHTML = '';

        if (cheques.length > 0) {
            cheques.forEach((cheque) => {
                let classeEmpresa = 'outros';
                if (cheque.empresa === 'clinica') {
                    classeEmpresa = 'clinica';
                } else if (cheque.empresa === 'escola') {
                    classeEmpresa = 'escola';
                }
            
                const buttonHTML = `
                    <button onclick="marcarComoCompensado('${cheque.cheque_numero}')">Marcar como Compensado</button>
                `;
                document.getElementById('proximoCheque').innerHTML += `
                    <div class="${classeEmpresa}">
                        <p>Cheque nº: ${cheque.cheque_numero}</p>
                        <p>Empresa Emitente: ${cheque.empresa}</p>
                        <p>Beneficiário: ${cheque.nome_beneficiario}</p>
                        <p>Data de Vencimento: ${formatarData(cheque.data_vencimento)}</p>
                        <p>Valor: R$ ${parseFloat(cheque.valor).toFixed(2).replace('.', ',')}</p>
                        <p>Status: ${cheque.status || 'Indefinido'}</p> <!-- Adiciona fallback -->
                        ${buttonHTML}
                    </div>
                `;
            });
            
        } else {
            proximoChequeDiv.innerHTML = '<p>Nenhum cheque próximo ao vencimento encontrado.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar próximos cheques:', error);
        alert('Erro ao carregar próximos cheques.');
    }
}

// Marcar cheque como compensado
async function marcarComoCompensado(chequeNumero) {
    console.log("Marcando cheque como compensado:", chequeNumero);

    try {
        const response = await fetch(`http://localhost:5002/api/cheques/compensar/${chequeNumero}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message || 'Cheque marcado como compensado com sucesso!');
            carregarProximosCheques(); // Atualiza a lista
        } else {
            alert(result.message || 'Erro ao marcar o cheque como compensado.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
}

// Formatar datas para exibição
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}
