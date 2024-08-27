import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ejs from 'ejs';

import UsuariosRepository from '../repositories/UsuariosRepository.js';
import VeiculosRepository from '../repositories/VeiculosRepository.js';

class UsuariosController {
    async index(req, res) {
        try {
            // Busca todos os usuários
            const usuarios = await UsuariosRepository.findAll();
            for (const usuario of usuarios) {
                const veiculo = await VeiculosRepository.findByUsuarioId(usuario.id);
                usuario.veiculo = veiculo; // Adiciona o veículo ao objeto do usuário
            }

            // Caminho absoluto para o arquivo painel.ejs
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            const filePath = join(__dirname, '../views/painel.ejs');

            // Renderiza o arquivo painel.ejs com os dados dos usuários e veículos
            ejs.renderFile(filePath, { usuarios }, (err, html) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Erro ao renderizar a página');
                } else {
                    res.send(html);
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao buscar dados de usuários');
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
        const usuarioAtualizado = await UsuariosRepository.update(usuario, id);
        res.json(usuarioAtualizado);
    }

    async delete(req, res) {
        const id = req.params.id;
        const resultado = await UsuariosRepository.delete(id);
        res.json(resultado);
    }
}

export default new UsuariosController();





