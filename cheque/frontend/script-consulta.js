// Função para carregar todos os cheques
let cheques = []; // Declarando a variável global para armazenar os cheques

function carregarCheques() {
    const status = document.getElementById('statusFilter').value; // Pegamos o status selecionado
    const url = `/api/cheques?status=${status}`; // Construímos a URL com o filtro de status

    // Fazendo a requisição para o backend
    fetch(url)
        .then(response => response.json())
        .then(data => {
            cheques = data; // Armazenando os dados de cheques na variável global
            exibirCheques(data); // Exibe os cheques na tabela
        })
        .catch(error => {
            console.error('Erro ao carregar os cheques:', error);
        });
}

// Função para exibir os cheques
function exibirCheques(cheques) {
    const tabela = document.getElementById('chequesTable');

    // Limpa a tabela antes de exibir os dados
    tabela.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Nome do Emitente</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data de Emissão</th>
            <th>Data de Vencimento</th>
            <th>Ações</th>
        </tr>
    `;

    // Adiciona os cheques à tabela
    cheques.forEach(cheque => {
        // Formata a data de emissão
        let dataEmissaoFormatada = 'Data inválida';
        if (cheque.data_emissao) {
            const dataEmissao = new Date(cheque.data_emissao);
            if (!isNaN(dataEmissao)) {
                dataEmissaoFormatada = dataEmissao.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        }

        // Formata a data de vencimento
        let dataVencimentoFormatada = 'Data inválida';
        if (cheque.data_vencimento) {
            const dataVencimento = new Date(cheque.data_vencimento);
            if (!isNaN(dataVencimento)) {
                dataVencimentoFormatada = dataVencimento.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cheque.cheque_numero}</td>
            <td>${cheque.nome_beneficiario}</td>
            <td>${cheque.valor}</td>
            <td>${cheque.status}</td>
            <td>${dataEmissaoFormatada}</td>
            <td>${dataVencimentoFormatada}</td>
            <td>
                <button onclick="editarCheque(${cheque.id})">Editar</button>
                <button onclick="excluirCheque(${cheque.id})">Excluir</button>
            </td>
        `;
        tabela.appendChild(row);
    });
}

// Função para filtrar os cheques (chama carregarCheques com o status selecionado)
function filtrarCheques() {
    carregarCheques(); // Recarrega os cheques com o filtro
}

function excluirCheque(id) {
    if (confirm("Tem certeza que deseja excluir este cheque?")) {
        fetch(`/api/cheques/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir o cheque');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            carregarCheques(); // Atualiza a tabela após exclusão
        })
        .catch(error => {
            console.error('Erro ao excluir cheque:', error);
            alert('Erro ao excluir cheque.');
        });
    }
}

// Função para editar cheque
function editarCheque(id) {
    const cheque = cheques.find(cheque => cheque.id === id);

    if (!cheque) {
        console.error('Cheque não encontrado!');
        return;
    }

    document.getElementById('editChequeId').value = cheque.id;
    document.getElementById('editChequeNumero').value = cheque.cheque_numero;
    document.getElementById('editNomeBeneficiario').value = cheque.nome_beneficiario;
    document.getElementById('editValor').value = cheque.valor;
    document.getElementById('editStatus').value = cheque.status;
    document.getElementById('editDataEmissao').value = cheque.data_emissao.split('T')[0];
    document.getElementById('editDataVencimento').value = cheque.data_vencimento.split('T')[0];
    document.getElementById('editDescricao').value = cheque.descricao;

    document.getElementById('modalEditar').style.display = 'block';
}

// Função para fechar o modal
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('modalEditar').style.display = 'none';
});

// Fechar o modal se o usuário clicar fora dele
window.onclick = function(event) {
    if (event.target === document.getElementById('modalEditar')) {
        document.getElementById('modalEditar').style.display = 'none';
    }
};

// Atualiza os dados do cheque quando o formulário for enviado
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(chequeData)
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message || 'Cheque cadastrado com sucesso!');
            chequeForm.reset();
        } else {
            alert(result.error || 'Erro ao cadastrar o cheque.');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao conectar com o servidor.');
    }
});


// Carrega os cheques ao carregar a página
window.onload = carregarCheques;
