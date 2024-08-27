function excluirReserva(event) {
    event.preventDefault(); // Evita o comportamento padrão do link
    
    // Confirmar se o usuário realmente deseja excluir a reserva
    if (confirm("Tem certeza que deseja excluir esta reserva?")) {
        // Remover a linha da tabela correspondente à reserva
        var row = event.target.parentElement.parentElement;
        row.remove();
    }
}

// Adicionar um ouvinte de evento a todos os links de classe "excluir-reserva"
var excluirLinks = document.querySelectorAll('.excluir-reserva');
excluirLinks.forEach(function(link) {
    link.addEventListener('click', excluirReserva);
});

// Função para confirmar uma reserva
function confirmarReserva(event) {
    event.preventDefault(); // Evita o comportamento padrão do link
    
    // Adicione aqui a lógica para confirmar a reserva
    alert("Reserva confirmada!");
}

// Adicionar um ouvinte de evento a todos os links de classe "confirmar-reserva"
var confirmarLinks = document.querySelectorAll('.confirmar-reserva');
confirmarLinks.forEach(function(link) {
    link.addEventListener('click', confirmarReserva);
});
function editarDiaHorario(event) {
    event.preventDefault(); // Evita o comportamento padrão do link
    
    // Capturar o novo valor do dia do horário da reserva
    var novoDiaHorario = prompt("Digite o novo dia e horário da reserva (formato: DD/MM/YYYY HH:mm):");
    
    // Verificar se o usuário inseriu um novo valor
    if (novoDiaHorario !== null && novoDiaHorario !== "") {
        // Atualizar o conteúdo da célula correspondente ao dia do horário
        var cell = event.target.parentElement.previousElementSibling.previousElementSibling.previousElementSibling;
        cell.textContent = novoDiaHorario;
    }
}

// Adicionar um ouvinte de evento a todos os links de classe "editar-dia-horario"
var editarLinks = document.querySelectorAll('.editar-dia-horario');
editarLinks.forEach(function(link) {
    link.addEventListener('click', editarDiaHorario);
});