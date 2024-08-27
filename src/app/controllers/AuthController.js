import FuncionariosRepository from '../repositories/FuncionariosRepository.js';
import LogRepository from '../repositories/LogRepository.js';
class AuthController {
    async login(req, res) {
        const { nome, senha } = req.body;

        try {
            // Verifica o nome e a senha no repositório de funcionários
            const usuario = await FuncionariosRepository.findByEmailAndSenha(nome, senha);
            
            if (!usuario) {
                return res.status(401).render('login', { error: 'Credenciais inválidas' }); 
            }

            // Autenticação bem-sucedida, definir a sessão do usuário
            req.session.usuario = usuario;

            // Registrar o log de login
            await LogRepository.create({
                usuarioId: usuario.id,
                acao: 'login'
            });

            // Redirecionar o usuário para o painel após o login
            res.redirect('/painel');
        } catch (error) {
            console.error('Erro durante o login:', error);
            res.status(500).render('login', { error: 'Erro interno do servidor' });
        }
    }
    async logout(req, res) {
        try {
            const usuario = req.session.usuario;

            if (usuario) {
                // Registrar o log de saída
                await LogRepository.create({
                    usuarioId: usuario.id,
                    acao: 'logout'
                });

                // Destruir a sessão
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Erro ao destruir a sessão:', err);
                        return res.status(500).json({ error: 'Erro ao sair' });
                    }

                    // Redirecionar para a página de login
                    res.redirect('/login');
                });
            } else {
                res.redirect('/login');
            }
        } catch (error) {
            console.error('Erro durante o logout:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}


export default new AuthController();
