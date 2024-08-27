import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';  
import http from 'http';
import { Server } from 'socket.io';


import UsuariosController from './app/controllers/UsuariosController.js';
import VeiculosController from './app/controllers/VeiculosController.js';
import PreagendamentoController from './app/controllers/PreagendamentoController.js';
import AuthController from './app/controllers/AuthController.js';


const app = express();
const server = http.createServer(app);
const io = new Server(server);


app.use(session({
    secret: 'secreta_chave_de_sessao',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Mude para true em produção, com HTTPS
}));

// Middleware para processar corpos de requisição JSON
app.use(express.json());

// Middleware para processar corpos de requisição URL-encoded
app.use(express.urlencoded({ extended: true }));

// Determine o caminho para o diretório de views
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const viewsPath = path.join(currentDir, 'app', 'views');

// Configura o Express para usar o diretório de viewsa
app.set('views', viewsPath);

// Configura o mecanismo de visualização como EJS
app.set('view engine', 'ejs');

// Adiciona middleware para servir arquivos estáticos
app.use(express.static(path.join(currentDir, 'public')));

// Rotas de autenticação
app.post('/login', AuthController.login);
app.get('/login', (req, res) => res.render('login')); // Rota para renderizar a página de login

io.on('connection', (socket) => {
    console.log('Novo cliente conectado');
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Middleware para proteger rotas
function verificarAutenticacao(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.redirect('/login');
    }
}
app.post('/login', AuthController.login);
app.get('/logout', AuthController.logout);

// Rotas protegidas com middleware de verificação de autenticação
app.get('/usuarios', verificarAutenticacao, UsuariosController.index);
app.get('/usuarios/:id', verificarAutenticacao, UsuariosController.show);
app.post('/usuarios', verificarAutenticacao, UsuariosController.store);
app.put('/usuarios/:id', verificarAutenticacao, UsuariosController.update);
app.delete('/usuarios/:id', verificarAutenticacao, UsuariosController.delete);

app.get('/preagendamento', verificarAutenticacao, PreagendamentoController.index);
app.get('/preagendamento/:id', verificarAutenticacao, PreagendamentoController.show);
app.post('/preagendamento', verificarAutenticacao, PreagendamentoController.store);
app.put('/preagendamento/:id', verificarAutenticacao, PreagendamentoController.update);//
app.delete('/preagendamento/:id', verificarAutenticacao, PreagendamentoController.delete);
app.put('/confirmar-preagendamento/:id', verificarAutenticacao, PreagendamentoController.confirmarPreagendamento);
app.put('/recusar-agendamento/:id', verificarAutenticacao, PreagendamentoController.recusar);

// Adiciona o controller da Preagendamento à rota /painel
app.get('/painel', verificarAutenticacao, UsuariosController.index);
app.get('/painel', verificarAutenticacao, VeiculosController.index);
app.get('/painel', verificarAutenticacao, PreagendamentoController.index);

app.get('/painelConfirmados', verificarAutenticacao, UsuariosController.getUsuariosConfirmadosPorDocas);
app.get('/preagendamento/confirmados/data/:data/doca/:doca', verificarAutenticacao, PreagendamentoController.findByDateAndDoca);// nao usa pra nada 
app.get('/preagendamento/confirmados/data/:data', verificarAutenticacao, PreagendamentoController.findByDate);
app.get('/relatorio-cargas-confirmadas/pdf/:data', verificarAutenticacao, PreagendamentoController.gerarRelatorioPDF);
app.get('/detalhes_agendamento/:idAgendamento', verificarAutenticacao, UsuariosController.getDetalhesAgendamento);
app.get('/relatorio-cargas-confirmadas/data/:data', verificarAutenticacao, PreagendamentoController.findByDate);

app.get('/preagendamento/:id', verificarAutenticacao, PreagendamentoController.getDisponibilidadePorAgendamento);
app.get('/preagendamento/disponibilidade/:id', PreagendamentoController.getDisponibilidadePorAgendamento);

app.put('/preagendamento/inicio/:id', PreagendamentoController.registrarInicio);
app.put('/preagendamento/fim/:id',  PreagendamentoController.registrarFim);

app.get('/preagendamento/disponibilidade/:data', verificarAutenticacao, PreagendamentoController.verificarDisponibilidade);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Erro interno no servidor');
});

// CREATE TABLE logs (
//     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
//     usuario_id BIGINT UNSIGNED NOT NULL,
//     acao VARCHAR(255) NOT NULL,
//     data_hora TIMESTAMP NOT NULL,
//     preagendamento_id INT,
//     FOREIGN KEY (usuario_id) REFERENCES funcionarios(id), -- Corrigindo a referência para funcionarios
//     FOREIGN KEY (preagendamento_id) REFERENCES preagendamentos(id)
// );


// tabela de registro do agendamento 

// CREATE TABLE tempos_descarregamento (
//     id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
//     preagendamento_id BIGINT UNSIGNED NOT NULL,
//     inicio_descarregamento DATETIME,
//     fim_descarregamento DATETIME,
//     FOREIGN KEY (preagendamento_id) REFERENCES preagendamentos(id)
// );

export default app;
