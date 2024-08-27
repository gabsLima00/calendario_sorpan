function logar(){
    
    var login = document.getElementById('login').value;
    var senha = document.getElementById('senha').value;

    if(login == "adm" && senha == "123"){
        location.href = "http://127.0.0.1:5500/index/index.html";
    }else{
        alert("usurio ou senha incorreta");
    }
}
