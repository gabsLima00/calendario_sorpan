import { consulta } from '../database/conexao.js';

class DisponibilidadeRepository {
    async decrementarQuantidadeReservas(data) {
        const formattedDate = typeof data === 'string' ? data.split('T')[0] : new Date(data).toISOString().split('T')[0];
        const sqlSelect = `SELECT id, quantidadeReserva FROM disponibilidades WHERE data = ?`;
        const valuesSelect = [formattedDate];
    
        try {
            const resultSelect = await consulta(sqlSelect, valuesSelect);
    
            if (resultSelect.length === 0) {
                console.warn(`Nenhuma disponibilidade encontrada para a data ${formattedDate}.`);
                return;
            }
    
            const disponibilidadesId = resultSelect[0].id;
    
            const sqlUpdate = `UPDATE disponibilidades SET quantidadeReserva = quantidadeReserva - 1 WHERE id = ?`;
            const valuesUpdate = [disponibilidadesId];
            const resultUpdate = await consulta(sqlUpdate, valuesUpdate);
    
            if (!resultUpdate || resultUpdate.affectedRows !== 1) {
                throw new Error(`Não foi possível decrementar a quantidade de reservas para a data ${formattedDate}.`);
            }
    
            return resultUpdate;
        } catch (error) {
            console.error('Erro ao decrementar quantidade de reservas:', error);
            throw new Error('Erro ao decrementar quantidade de reservas.');
        }
    }
    async incrementarQuantidadeReservas(data) {
        const formattedDate = data.split('T')[0]; // Formata a data para 'YYYY-MM-DD'
        const sqlSelect = `SELECT id, quantidadeReserva FROM disponibilidades WHERE data = ?`;
        const valuesSelect = [formattedDate];
        const resultSelect = await consulta(sqlSelect, valuesSelect);

        if (resultSelect.length === 0) {
            const sqlInsert = `INSERT INTO disponibilidades (data, quantidadeReserva, disponivel, createdAt, updatedAt) VALUES (?, 1, 1, NOW(), NOW())`;
            const valuesInsert = [formattedDate];
            const resultInsert = await consulta(sqlInsert, valuesInsert);

            if (!resultInsert || resultInsert.affectedRows !== 1) {
                throw new Error(`Não foi possível criar a disponibilidade para a data ${data}.`);
            }

            return resultInsert;
        } else {
            const sqlUpdate = `UPDATE disponibilidades SET quantidadeReserva = quantidadeReserva + 1 WHERE id = ?`;
            const valuesUpdate = [resultSelect[0].id];
            const resultUpdate = await consulta(sqlUpdate, valuesUpdate);

            if (!resultUpdate || resultUpdate.affectedRows !== 1) {
                throw new Error(`Não foi possível incrementar a quantidade de reservas para a data ${data}.`);
            }

            return resultUpdate;
        }
    }

    async updatePreagendamentoDisponibilidadeId(preagendamentoId, disponibilidadesId) {
        const sqlUpdate = `UPDATE preagendamentos SET disponibilidades_id = ? WHERE id = ?`;
        const valuesUpdate = [disponibilidadesId, preagendamentoId];
        const resultUpdate = await consulta(sqlUpdate, valuesUpdate);

        if (!resultUpdate || resultUpdate.affectedRows !== 1) {
            throw new Error(`Não foi possível atualizar o disponibilidades_id no preagendamento ${preagendamentoId}.`);
        }

        return resultUpdate;
    }

    async updateAvailabilityInTransaction(originalData, newData, preagendamentoId) {
        try {
            let newDisponibilidadeId;

            // Verifica e converte originalData para string se não for nulo ou undefined
            if (originalData) {
                const formattedOriginalDate = typeof originalData === 'string' ? originalData.split('T')[0] : new Date(originalData).toISOString().split('T')[0];
                await this.decrementarQuantidadeReservas(formattedOriginalDate);
            }

            // Verifica e converte newData para string se não for nulo ou undefined
            if (newData) {
                const formattedNewDate = typeof newData === 'string' ? newData.split('T')[0] : new Date(newData).toISOString().split('T')[0];
                const result = await this.incrementarQuantidadeReservas(formattedNewDate);
                newDisponibilidadeId = result.insertId || result.id; // Obtém o id da nova disponibilidade
            }

            // Atualiza a chave estrangeira do preagendamento com o novo ID da disponibilidade
            if (preagendamentoId && newDisponibilidadeId) {
                await this.updatePreagendamentoDisponibilidadeId(preagendamentoId, newDisponibilidadeId);
            }

            return newDisponibilidadeId; // Retorna o novo ID da disponibilidade para uso posterior, se necessário
        } catch (error) {
            console.error('Erro ao atualizar a disponibilidade na transação:', error);
            throw new Error('Erro ao atualizar a disponibilidade na transação.');
        }
    }
}

export default new DisponibilidadeRepository();
