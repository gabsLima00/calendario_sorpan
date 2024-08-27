import express from 'express';
import session from 'express-session';
import Usuario from '../models/UsuariosLogin'; // Importe o modelo de usuário aqui


const router = express.Router();

router.use(session({
  secret: 'seuSegredo', // Coloque sua chave secreta aqui
  resave: false,
  saveUninitialized: true
}));

router.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, private, no-cache, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
});

router.post('/tratar-login', async (req, res) => {
  const { login, senha } = req.body;

  try {
    // Encontre o usuário com o CPF e a data fornecidos
    const usuario = await Usuario.findOne({ where: { data: login, cpf: senha } });

    // Verifique se o usuário existe e tem permissão
    if (usuario) {
      const permissao = await Usuario.findOne({ where: { permissao: true } });
      if (permissao) {
        // Defina os dados do usuário na sessão
        req.session.usuario = usuario;
        req.session.loggedIn = true;
        res.redirect('/painel'); // Redirecione para o painel após o login bem-sucedido
      } else {
        res.send('Sem autorização'); // Se não tiver permissão, envie uma mensagem de erro
      }
    } else {
      res.redirect('/'); // Se o usuário não for encontrado, redirecione para a página inicial
    }
  } catch (error) {
    console.error('Erro ao tratar o login:', error);
    res.status(500).send('Erro interno ao processar o login'); // Em caso de erro, envie uma mensagem de erro 500
  }
});

export default router;
