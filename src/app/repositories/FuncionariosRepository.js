import { consulta } from "../database/conexao.js";

class FuncionariosRepository {
    async findByEmailAndSenha(nome, senha) {
        const query = `SELECT * FROM funcionarios WHERE nome = ? AND senha = ?`;
        const values = [nome, senha];
        try {
            const rows = await consulta(query, values);
            if (rows.length > 0) {
                return rows[0];
            } else {
                return null; // Retorna null se nenhum funcionário for encontrado
            }
        } catch (error) {
            console.error('Erro na consulta ao banco de dados:', error);
            throw error;
        }
    }
}

export default new FuncionariosRepository();