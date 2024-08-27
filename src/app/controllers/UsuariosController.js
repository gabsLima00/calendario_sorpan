import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


import UsuariosRepository from '../repositories/UsuariosRepository.js';

class UsuariosController {
    async index(req, res) {
       

        try {
            // Busca todos os usuários NÃO confirmados do banco de dados (confirmado = 0)
            const usuariosNaoConfirmados = await UsuariosRepository.findAll();

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            const filePath = join(__dirname, '../views/painel.ejs');

            // Renderize o arquivo painel.ejs com os dados dos usuários NÃO confirmados
            ejs.renderFile(filePath, { usuarios: usuariosNaoConfirmados }, (err, html) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Erro ao renderizar a página');
                } else {
                    // Envia o HTML renderizado como resposta
                    res.send(html);
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao buscar dados de usuários');
        }
    }
 
    async getUsuariosConfirmadosPorDocas(req, res) {
        try {
            // Busca os usuários confirmados para cada doca
            const usuariosDoca1 = await UsuariosRepository.getUsuariosConfirmadosPorDoca(1);
            const usuariosDoca2 = await UsuariosRepository.getUsuariosConfirmadosPorDoca(2);
            const usuariosDoca3 = await UsuariosRepository.getUsuariosConfirmadosPorDoca(3);
            
            // Renderiza a página painelConfirmados.ejs com os dados dos usuários confirmados para cada doca
            res.render('painelConfirmados', { 
                usuariosDoca1: usuariosDoca1,
                usuariosDoca2: usuariosDoca2,
                usuariosDoca3: usuariosDoca3
            });
        } catch (error) {
            console.error('Erro ao buscar dados de usuários confirmados por doca:', error);
            res.status(500).send('Erro interno ao buscar dados de usuários confirmados por doca');
        }
    }
    async show(req, res) {
        const id = req.params.id;
        const usuario = await UsuariosRepository.findById(id);
        res.json(usuario);
    }

    async store(req, res) {
        const usuario = req.body;
        const novoUsuario = await UsuariosRepository.create(usuario);
        res.json(novoUsuario);
    }

    async update(req, res) {
        const id = req.params.id;
        const usuario = req.body;
        try {
            const usuarioAtualizado = await UsuariosRepository.update(usuario, id);
            res.json(usuarioAtualizado);
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao atualizar usuário');
        }
    }

    async delete(req, res) {
        const id = req.params.id;
        const resultado = await UsuariosRepository.delete(id);
        res.json(resultado);
    }

    async getUsuariosConfirmados(req, res) {
        try {
            const usuariosConfirmados = await UsuariosRepository.getUsuariosConfirmados();
            res.render('painelConfirmados', { usuarios: usuariosConfirmados });
        } catch (error) {
            console.error('Erro ao buscar dados de usuários confirmados:', error);
            res.status(500).send('Erro interno ao buscar dados de usuários confirmados');
        }
    }
    async getDetalhesAgendamento(req, res) {
        const idAgendamento = req.params.idAgendamento;
        const previousPage = req.headers.referer || '/painel'; // Página padrão caso a URL anterior não esteja disponível
        const isConfirmedPanel = previousPage.includes('painelConfirmados');
    
        try {
            // Recupera informações detalhadas do agendamento com base no ID
            const detalhesAgendamento = await UsuariosRepository.findDetalhesAgendamentoById(idAgendamento);
            
            // Adicionando console.log para exibir os detalhes do agendamento
            console.log("Detalhes do Agendamento:", detalhesAgendamento);
    
            res.render('detalhes', { detalhesAgendamento, previousPage, isConfirmedPanel }); // Passando os detalhes do agendamento, a URL da página anterior e a flag indicando se é a página de agendamentos confirmados para o template 'detalhes.ejs'
        } catch (error) {
            console.error('Erro ao recuperar os detalhes do agendamento:', error);
            res.status(500).send('Erro ao recuperar os detalhes do agendamento');
        }
    }
}


export default new UsuariosController();