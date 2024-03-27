let etapaAtual = 1;

function proximaEtapa(n) {
    document.getElementsByClassName('etapa')[etapaAtual - 1].style.display = 'none';
    etapaAtual += n;
    if (etapaAtual > document.getElementsByClassName('etapa').length) {
        etapaAtual = document.getElementsByClassName('etapa').length;
    }
    document.getElementsByClassName('etapa')[etapaAtual - 1].style.display = 'block';
    salvarDados();
}

function etapaAnterior() {
    document.getElementsByClassName('etapa')[etapaAtual - 1].style.display = 'none';
    etapaAtual--;
    if (etapaAtual < 1) {
        etapaAtual = 1;
    }
    document.getElementsByClassName('etapa')[etapaAtual - 1].style.display = 'block';
}

document.getElementById("nome").addEventListener("input", function() {
    this.value = this.value.toUpperCase();
})
function mostrarCamposTransportadora() {
    var checkbox = document.getElementById('transportadora');
    var camposTransportadora = document.getElementById('camposTransportadora');
    camposTransportadora.style.display = checkbox.checked ? 'block' : 'none';
}

function salvarDados() {
    const formData = new FormData(document.getElementById('formulario').getElementsByClassName('etapa')[etapaAtual - 1]);
    for (const [key, value] of formData.entries()) {
        localStorage.setItem(`${key}_etapa${etapaAtual}`, value);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    for (let i = 1; i <= 3; i++) {
        const stepData = localStorage.getItem(`nome_etapa${i}`);
        if (stepData) {
            document.getElementsByClassName('etapa')[i - 1].style.display = 'none';
        } else {
            break; 
        }
    }
});

function selectOption(option) {
    document.getElementById("caminho").value = option;
    document.querySelector('.options').style.display = 'none';
}

function converterParaMaiusculas() {
    var inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
    inputs.forEach(function(input) {
        input.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    });
}

window.addEventListener('load', converterParaMaiusculas);