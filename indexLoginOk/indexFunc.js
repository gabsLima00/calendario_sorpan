function logar() {
    var cpf = document.getElementById('cpf_login').value;
    var senha = document.getElementById('nascimneto_login').value;

    if (cpf === "adm" && senha === "123") {
        location.href = "http://127.0.0.1:5500/index/index.html";
    } else {
        alert("Usuário nâo registrado");
    }
}
