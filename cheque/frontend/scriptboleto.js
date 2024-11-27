document.addEventListener('DOMContentLoaded', function () {
    const chequeForm = document.getElementById('chequeForm');
    console.log("chequeForm encontrado:", chequeForm);

    if (chequeForm) {
        chequeForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log("Evento submit disparado para o formulário de boleto");

            const boletoData = {
                nome_pagador: document.getElementById('nome_pagador').value,
                cpf_pagador: document.getElementById('cpf_pagador').value,
                endereco_pagador: document.getElementById('endereco_pagador').value,
                valor: parseFloat(document.getElementById('valor').value),
                data_emissao: document.getElementById('data_emissao').value,
                data_vencimento: document.getElementById('data_vencimento').value,
                descricao: document.getElementById('descricao').value
            };

            try {
                const response = await fetch('http://localhost:5002/api/boletos/cadastroboleto', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(boletoData)
                });

                const result = await response.json();
                if (response.ok) {
                    alert(result.message || 'Boleto cadastrado com sucesso!');
                    chequeForm.reset(); // Limpa o formulário
                } else {
                    alert(result.error || 'Erro ao cadastrar o Boleto.');
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                alert('Erro ao conectar com o servidor.');
            }
        });
    } else {
        console.error('Erro: Formulário com ID "chequeForm" não encontrado.');
    }
});

// Função para buscar boletos próximos ao vencimento
function buscarBoletosProximos() {
    fetch('http://localhost:5002/api/boletos/proximos-boletos')
        .then(response => response.json())
        .then(data => {
            const proximoBoletoDiv = document.getElementById("proximoBoleto");
            proximoBoletoDiv.innerHTML = '';

            if (data.length > 0) {
                data.forEach(boleto => {
                    const boletoInfo = document.createElement("div");
                    boletoInfo.className = "boleto-info";
                    boletoInfo.id = `boleto-${boleto.id}`; // Garantir ID único para cada boleto
                    boletoInfo.innerHTML = `
                        <p><strong>Nome do Pagador:</strong> ${boleto.nome_pagador}</p>
                        <p><strong>Cpf do Pagador:</strong> ${boleto.cpf_pagador}</p>
                        <p><strong>Endereço do Pagador:</strong> ${boleto.endereco_pagador}</p>
                        <p><strong>Valor:</strong> ${boleto.valor}</p>
                        <p><strong>Data de EmissãoÇ</strong> ${boleto.data_emissao}</p>
                        <p><strong>Data de Vencimento:</strong> ${boleto.data_vencimento}</p>
                        <p><strong>Descrição:</strong> ${boleto.descricao}</p>
                        <button onclick="marcarComoCompensado(${boleto.id})">Marcar como Compensado</button>
                    `;

                    proximoBoletoDiv.appendChild(boletoInfo);
                });
            } else {
                proximoBoletoDiv.innerHTML = '<p>Nenhum boleto próximo ao vencimento.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao buscar boleto próximos ao vencimento:', error);
            alert('Erro ao buscar boletos próximos ao vencimento.');
        });
}

// Função para formatar a data no formato DD/MM/AAAA
function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para marcar o boleto como "Compensado"
function marcarComoCompensado(id) {
    fetch(`http://localhost:5002/api/boletos/compensar/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Boleto marcado como compensado!');
            
            // Remover o cheque da tela (após ser compensado)
            const boletoDiv = document.getElementById(`boleto-${id}`);
            if (boletoDiv) {
                boletoDiv.remove();
            }
        } else {
            alert('Erro ao marcar boleto como compensado.');
        }
    })
    .catch(error => {
        console.error('Erro ao marcar boleto como compensado:', error);
        alert('Erro ao marcar boleto como compensado.');
    });
}


// Chama a função ao carregar a página
document.addEventListener("DOMContentLoaded", function () {
    buscarBoletosProximos();
});


function consultarBoletos() {
    const dataVencimento = document.getElementById('consultaData').value;
    fetch(`http://localhost:5002/api/boletos/buscar-por-vencimento?dataVencimento=${dataVencimento}`)
        .then(response => response.json())
        .then(data => {
            const resultadosDiv = document.getElementById("resultados");
            resultadosDiv.innerHTML = '';  // Limpa a área de resultados

            if (data.length > 0) {
                data.forEach(boleto => {
                    resultadosDiv.innerHTML += `
                        <p><strong>Nome do Pagador:</strong> ${boleto.nome_pagador}</p>
                        <p><strong>Cpf do Pagador:</strong> ${boleto.cpf_pagador}</p>
                        <p><strong>Endereço do Pagador:</strong> ${boleto.endereco_pagador}</p>
                        <p><strong>Valor:</strong> ${boleto.valor}</p>
                        <p><strong>Data de Emissãoç</strong> ${boleto.data_emissao}</p>
                        <p><strong>Data de Vencimento:</strong> ${boleto.data_vencimento}</p>
                        <p><strong>Descrição:</strong> ${boleto.descricao}</p>
                    `;
                });
            } else {
                resultadosDiv.innerHTML = '<p>Nenhum boleto encontrado para esta data.</p>';
            }
        })
        .catch(error => {
            console.error('Erro ao consultar boletos:', error);
            alert('Erro ao consultar boletos.');
        });
}
