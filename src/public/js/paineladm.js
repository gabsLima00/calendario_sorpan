document.addEventListener('DOMContentLoaded', () => {
    const editarLinks = document.querySelectorAll('.editar-reserva');
    editarLinks.forEach(link => {
        link.addEventListener('click', async (event) => {
            event.preventDefault();

            const preagendamentoId = event.target.dataset.id;

            try {
                const response = await fetch(`/preagendamento/${preagendamentoId}`);
                const preagendamento = await response.json();

                if (!preagendamento) {
                    console.error('Preagendamento não encontrado.');
                    return;
                }

                const editForm = document.createElement('form');
                editForm.classList.add('edit-form');

                const campos = ['data', 'horario', 'doca'];

                campos.forEach(campo => {
                    const label = document.createElement('label');
                    label.textContent = campo[0].toUpperCase() + campo.slice(1) + ':';

                    let input;
                    if (campo === 'horario' || campo === 'doca') {
                        input = document.createElement('input');
                        input.classList.add('edit-input');
                        input.setAttribute('name', campo);
                        input.setAttribute('readonly', true);

                        if (campo === 'horario') {
                            input.setAttribute('id', 'editar-horario');
                        } else {
                            input.setAttribute('id', 'editar-doca');
                        }
                    } else {
                        input = document.createElement('input');
                        input.classList.add('edit-input');
                        input.setAttribute('name', campo);
                        input.type = 'date';
                        input.value = preagendamento[campo] ? new Date(preagendamento[campo]).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
                    }

                    const container = document.createElement('div');
                    container.appendChild(label);
                    container.appendChild(input);
                    container.appendChild(document.createElement('br'));

                    editForm.appendChild(container);
                });

                const escolherButton = document.createElement('button');
                escolherButton.type = 'button';
                escolherButton.textContent = 'Escolher Doca e Horário';
                escolherButton.addEventListener('click', () => {
                    abrirModalEscolhaDocaHorario(preagendamentoId);
                });

                const salvarButton = document.createElement('button');
                salvarButton.type = 'button';
                salvarButton.textContent = 'Salvar';
                salvarButton.addEventListener('click', async () => {
                    if (editForm.reportValidity()) {
                        const formData = new FormData(editForm);
                        const payload = {};

                        formData.forEach((value, name) => {
                            payload[name] = value;
                        });

                        payload['horario'] = payload['horario'].slice(0, 5);

                        try {
                            const updateResponse = await fetch(`/preagendamento/${preagendamentoId}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload),
                            });

                            if (updateResponse.ok) {
                                alert('Dados atualizados com sucesso!');
                                location.reload();
                            } else {
                                alert('Erro ao atualizar os dados.');
                                console.log(updateResponse);
                            }
                        } catch (error) {
                            console.error('Erro ao atualizar preagendamento:', error);
                            alert('Erro ao atualizar os dados.');
                        }
                    }
                });

                const cancelarButton = document.createElement('button');
                cancelarButton.type = 'button';
                cancelarButton.textContent = 'Cancelar';
                cancelarButton.addEventListener('click', () => {
                    link.parentElement.removeChild(editForm);
                });

                editForm.appendChild(escolherButton);
                editForm.appendChild(salvarButton);
                editForm.appendChild(cancelarButton);

                link.parentElement.appendChild(editForm);
            } catch (error) {
                console.error('Erro ao buscar dados do agendamento:', error);
                alert('Erro ao buscar dados do agendamento.');
            }
        });
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const confirmarBotoes = document.querySelectorAll('.confirmar-reserva');

    confirmarBotoes.forEach(botao => {
        botao.addEventListener('click', async (event) => {
            const id = botao.getAttribute('data-id');
            const row = botao.closest('tr');
            const doca = row.querySelector('.doca').textContent;
            const horario = row.querySelector('.horario').textContent;

            if (!doca || doca === 'N/A' || !horario || horario === 'N/A') {
                alert('Por favor, defina a doca e o horário antes de confirmar.');
                return;
            }

            const confirmado = await confirmarPreagendamento(id);
            if (confirmado) {
                alert('Pré-agendamento confirmado com sucesso!');
                location.reload(); // Atualiza a página automaticamente após a confirmação
            }
        });
    });
}); 

async function confirmarPreagendamento(id) {
    try {
        const response = await fetch(`/confirmar-preagendamento/${id}`, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
            // Verificar se o status de confirmação é 1
            if (data.confirmado === 1) {
                return { success: true, message: 'Pré-agendamento confirmado com sucesso!' };
            } else {
                return { success: false, message: 'Erro ao confirmar pré-agendamento.' };
            }
        } else {
            // Se a resposta não está OK, retorna uma mensagem de erro
            return { success: false, message: data.error || 'Erro ao confirmar pré-agendamento.' };
        }
    } catch (error) {
        console.error('Erro ao confirmar pré-agendamento:', error);
        return { success: false, message: 'Erro interno ao confirmar pré-agendamento.' };
    }
}

document.addEventListener('click', function(event) {
    if (event.target.classList.contains('recusar-reserva')) {
        const agendamentoId = event.target.getAttribute('data-id');
        confirmarAcao(agendamentoId, 2, 'recusar', `Tem certeza que deseja recusar o pré-agendamento com ID ${agendamentoId}?`);
    } else if (event.target.classList.contains('remover-reserva')) {
        const agendamentoId = event.target.getAttribute('data-id');
        confirmarAcao(agendamentoId, 0, 'remover', `Tem certeza que deseja remover o pré-agendamento com ID ${agendamentoId}? Ele voltara para pagina de nao confirmados.`);
    }
});

function confirmarAcao(id, status, acao, mensagem) {
    if (confirm(mensagem)) {
        alterarStatusAgendamento(id, status, acao);
    }
}

function alterarStatusAgendamento(id, status, acao) {
    fetch(`/recusar-agendamento/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, acao }) // Enviar o status e a ação apropriados
    })
    .then(response => response.json())
    .then(data => {
        console.log(`Agendamento ${acao === 'recusar' ? 'recusado' : 'removido'}:`, data);
        alert(`Agendamento ${acao === 'recusar' ? 'recusado' : 'removido'}!`);
        location.reload();
    })
    .catch(error => console.error(`Erro ao ${acao === 'recusar' ? 'recusar' : 'remover'} agendamento:`, error));
}

async function abrirModalEscolhaDocaHorario(data) {
    try {
        const response = await fetch(`/preagendamento/disponibilidade/${data}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar disponibilidade');
        }
        const disponibilidade = await response.json();
        exibirDisponibilidadeModal(disponibilidade, true);
    } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
    }
}



function exibirDisponibilidadeModal(disponibilidade, isEditing) {
    const modalContainer = document.getElementById('modal-container');
    const modalDisponibilidadeContainer = document.getElementById('modal-disponibilidade-container');
    modalDisponibilidadeContainer.innerHTML = '';

    ['doca1', 'doca2', 'doca3'].forEach(doca => {
        const docaHeader = document.createElement('h3');
        docaHeader.textContent = `Doca ${doca.slice(-1)}`;
        modalDisponibilidadeContainer.appendChild(docaHeader);

        disponibilidade[doca].forEach(horarioInfo => {
            const horarioElement = document.createElement('p');
            horarioElement.textContent = `${horarioInfo.horario} - ${horarioInfo.disponivel ? 'Disponível' : 'Ocupado'}`;
            horarioElement.style.color = horarioInfo.disponivel ? 'green' : 'red';
            horarioElement.style.cursor = horarioInfo.disponivel ? 'pointer' : 'default';

            if (horarioInfo.disponivel) {
                horarioElement.addEventListener('click', () => {
                    if (isEditing) {
                        document.getElementById('editar-doca').value = doca.slice(-1);
                        document.getElementById('editar-horario').value = horarioInfo.horario;
                    }
                    modalContainer.style.display = 'none';
                });
            }

            modalDisponibilidadeContainer.appendChild(horarioElement);
        });
    });

    modalContainer.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function() {
    const closeModalButton = document.querySelector('.close-modal');
    closeModalButton.addEventListener('click', () => {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.style.display = 'none';
    });
});

// Adiciona a funcionalidade para fechar o modal clicando fora da área do modal


function makeModalDraggable(modal) {
    let isDragging = false;
    let offsetX, offsetY;

    modal.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - modal.getBoundingClientRect().left;
        offsetY = e.clientY - modal.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            modal.style.left = `${e.clientX - offsetX}px`;
            modal.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

const modalContent = document.querySelector('.modal-content');
makeModalDraggable(modalContent);


document.addEventListener('DOMContentLoaded', () => {
    const buscarDisponibilidadeButton = document.getElementById('buscar-disponibilidade');
    const dataInput = document.getElementById('data-input');

    buscarDisponibilidadeButton.addEventListener('click', async () => {
        const data = dataInput.value;
        if (!data) {
            alert('Por favor, insira uma data.');
            return;
        }

        abrirModalPesquisaDisponibilidade(data);
    });
});

async function abrirModalPesquisaDisponibilidade(data) {
    try {
        const response = await fetch(`/pesquisa/disponibilidade/${data}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar disponibilidade');
        }
        const disponibilidade = await response.json();
        exibirPesquisaDisponibilidadeModal(disponibilidade);
    } catch (error) {
        console.error('Erro ao buscar disponibilidade:', error);
    }
}

function exibirPesquisaDisponibilidadeModal(disponibilidade) {
    const modalContainer = document.getElementById('modal-container-2');
    const modalContent = modalContainer.querySelector('.modal-content');
    const modalContentInner = document.getElementById('modal-content-2');
    const closeModalButton = modalContainer.querySelector('.close-modal-2');
    
    modalContentInner.innerHTML = '';

    ['doca1', 'doca2', 'doca3'].forEach(doca => {
        const docaHeader = document.createElement('h3');
        docaHeader.textContent = `Doca ${doca.slice(-1)}`;
        modalContentInner.appendChild(docaHeader);

        disponibilidade[doca].forEach(horarioInfo => {
            const horarioElement = document.createElement('p');
            horarioElement.textContent = `${horarioInfo.horario} - ${horarioInfo.disponivel ? 'Disponível' : 'Ocupado'}`;
            horarioElement.style.color = horarioInfo.disponivel ? 'green' : 'red';
            horarioElement.style.cursor = horarioInfo.disponivel ? 'pointer' : 'default';

            modalContentInner.appendChild(horarioElement);
        });
    });

    modalContainer.style.display = 'block';

    closeModalButton.addEventListener('click', () => {
        modalContainer.style.display = 'none';
    });

    // Adiciona a funcionalidade para fechar o modal clicando fora da área do modal
    makeModalDraggable(modalContent);
}

// Função para tornar o modal arrastável
function makeModalDraggable(modal) {
    if (!modal) return; // Verifica se o modal é nulo antes de adicionar o event listener

    let isDragging = false;
    let offsetX, offsetY;

    modal.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - modal.getBoundingClientRect().left;
        offsetY = e.clientY - modal.getBoundingClientRect().top;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            modal.style.left = `${e.clientX - offsetX}px`;
            modal.style.top = `${e.clientY - offsetY}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}