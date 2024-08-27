import { consulta } from "../database/conexao.js";

class LogRepository {
    async create({ usuarioId, acao, preagendamentoId = null }) {
        const insertQuery = `
            INSERT INTO logs (usuario_id, acao, data_hora, preagendamento_id)
            VALUES (?, ?, NOW(), ?)
        `;
        const values = [usuarioId, acao, preagendamentoId];
    
        console.log('Inserindo log com valores:', values); // Log para verificar os valores inseridos
        console.log('Query SQL:', insertQuery); // Log para verificar a consulta SQL
    
        try {
            await consulta(insertQuery, values);
    
            const selectQuery = `
                SELECT * FROM logs WHERE id = LAST_INSERT_ID()
            `;
            console.log('Query de seleção:', selectQuery); // Log para verificar a consulta de seleção
    
            const rows = await consulta(selectQuery);
    
            return rows[0];
        } catch (error) {
            console.error('Erro ao criar log:', error);
            throw error;
        }
    }
}

export default new LogRepository();
