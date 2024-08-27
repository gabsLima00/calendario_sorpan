import { consulta } from "../database/conexao.js";

class PreagendamentoRepository {
    async findById(id) {
        const sql = "SELECT * FROM preagendamentos WHERE id = ?";
        console.log('Consultando preagendamento com ID:', id);

        try {
            const result = await consulta(sql, [id]); // Certifique-se de passar o ID dentro de um array
            console.log('Resultado da consulta:', result);
            if (result.length === 0) {
                throw new Error('Preagendamento não encontrado para o ID fornecido.');
            }
            return result[0]; // Retorna o primeiro resultado encontrado
        } catch (error) {
            console.error('Erro ao localizar dados do preagendamento:', error);
            const errorMessage = error && error.message ? error.message : 'Erro desconhecido ao localizar dados do preagendamento.';
            throw new Error(errorMessage);
        }
    }

    async create(preagendamento) {
        const sql = "INSERT INTO preagendamentos SET ?";
        const result = await consulta(sql, preagendamento, 'Não foi possível cadastrar preagendamento.');
        
        // Emitir evento para notificar clientes sobre o novo pré-agendamento
        io.emit('novo-preagendamento', preagendamento);
    
        return result;
    }

    async update(preagendamento, id) {
        try {
            const sqlUpdate = `
                UPDATE preagendamentos
                SET data = ?, horario = ?, doca = ?, disponibilidades_id = ?
                WHERE id = ?
            `;
            const valuesUpdate = [preagendamento.data, preagendamento.horario, preagendamento.doca, preagendamento.disponibilidades_id, id];

            const resultUpdate = await consulta(sqlUpdate, valuesUpdate);

            if (!resultUpdate || resultUpdate.affectedRows !== 1) {
                throw new Error(`Não foi possível atualizar o agendamento com o ID ${id}.`);
            }

            return preagendamento;
        } catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            throw new Error('Erro ao atualizar agendamento.');
        }
    }

    async delete(id) {
        const sql = "DELETE FROM preagendamentos WHERE id=?";
        return consulta(sql, id, 'Não foi possível excluir preagendamento.');
    }

    async findNaoConfirmados() {
        const sql = "SELECT * FROM preagendamentos WHERE confirmado = 0";
        try {
            const preagendamentosNaoConfirmados = await consulta(sql);
            return preagendamentosNaoConfirmados;
        } catch (error) {
            throw new Error('Erro ao buscar pré-agendamentos não confirmados no banco de dados: ' + error.message);
        }
    }

    async updatePreagendamento(preagendamento, idPreagendamento) {
        const { horario, doca, data } = preagendamento;

        const preagendamentoSql = `UPDATE preagendamentos 
                               SET horario = ?, doca = ?, data = ?
                               WHERE id = ?`;

        const preagendamentoValues = [horario, doca, data, idPreagendamento];

        try {
            console.log('Executando SQL de atualização do preagendamento:', preagendamentoSql, preagendamentoValues);

            const resultPreagendamento = await consulta(preagendamentoSql, preagendamentoValues);

            console.log('Resultado da atualização do preagendamento:', resultPreagendamento);

            return resultPreagendamento;
        } catch (error) {
            console.error('Erro ao atualizar o preagendamento:', error);
            const errorMessage = error && error.message ? error.message : 'Erro desconhecido ao atualizar o preagendamento.';
            throw new Error(errorMessage);
        }
    }
    async findDetailedById(id) {
        const query = `
            SELECT 
                pa.id as preagendamento,
                nf.numero as notaFiscal,
                nf.cte,
                pa.data,
                pa.horario,
                pa.doca,
                m.nome as motorista,
                u.email as usuarioEmail
            FROM preagendamentos pa
            JOIN fornecedors f ON pa.id = f.idPreAgendamento
            JOIN notafiscals nf ON f.id = nf.idFornecedor
            JOIN motoristas m ON pa.id = m.idPreagendamento
            JOIN usuarios u ON pa.idUsuario = u.id
            WHERE pa.id = ?;
        `;
        try {
            const result = await consulta(query, [id]);
            return result[0];
        } catch (error) {
            console.error('Erro ao buscar detalhes do pré-agendamento:', error);
            throw new Error('Erro interno ao buscar detalhes do pré-agendamento.');
        }
    }


    async findByDate(data, doca) {
        const sql = `
        SELECT DISTINCT
    p.id, 
    COALESCE(m.nome, 'Não Atribuído') AS motorista, 
    p.placaVeiculo, 
    u.nome_fantasia AS empresa,
    p.tipoDescarregamento AS descarregamento, 
    p.data, 
    p.doca, 
    p.horario,
    p.tipoCarga
FROM 
    preagendamentos p
JOIN 
    usuarios u ON u.id = p.idUsuario
LEFT JOIN 
    fornecedors f ON p.id = f.idPreAgendamento
LEFT JOIN 
    motoristas m ON m.idPreAgendamento = p.id 
WHERE 
    p.confirmado = 1
    AND DATE(p.data) = ?
ORDER BY 
    p.data ASC,
    p.horario ASC;`;

        try {
            const result = await consulta(sql, [data]);
            return result;
        } catch (error) {
            console.error('Erro ao buscar agendamentos confirmados por data e doca:', error);
            throw new Error('Erro interno ao buscar agendamentos confirmados por data e doca');
        }
    }

    async updateUM(preagendamento, id) {
        const sql = `
        UPDATE preagendamentos
        SET confirmado = ?
        WHERE id = ?`;
        try {
            const result = await consulta(sql, [preagendamento.confirmado, id]);
            return result;
        } catch (error) {
            console.error('Erro ao atualizar pré-agendamento:', error);
            throw new Error('Erro interno ao atualizar pré-agendamento.');
        }
    }

    async removerConfirmacao(idAgendamento) {
        try {
            const novoStatus = 0;
            const sql = `
                UPDATE preagendamentos
                SET confirmado = ?
                WHERE id = ?
            `;
            const result = await consulta(sql, [novoStatus, idAgendamento]);
            return result;
        } catch (error) {
            console.error('Erro ao remover confirmação do agendamento:', error);
            throw new Error('Erro interno ao remover confirmação do agendamento');
        }
    }

    async updateStatus(id, novoStatus) {
        const sql = `
            UPDATE preagendamentos
            SET confirmado = ?
            WHERE id = ?
        `;

        try {
            const result = await consulta(sql, [novoStatus, id]);
            return result;
        } catch (error) {
            console.error('Erro ao atualizar status do agendamento:', error);
            throw new Error('Erro interno ao atualizar status do agendamento');
        }
    }

    async checkDisponibilidade(data) {
        const sql = `
        select 
    d.doca, 
    h.horario, 
    COUNT(p.id) AS agendamentos
FROM 
    (SELECT 1 AS doca UNION ALL SELECT 2 UNION ALL SELECT 3) AS d
CROSS JOIN 
    (SELECT '21:00:00' AS horario UNION ALL SELECT '00:00:00' UNION ALL SELECT '01:00:00' UNION ALL SELECT '03:00:00') AS h
LEFT JOIN 
    preagendamentos p 
ON  
    p.confirmado = 1
    AND p.doca = d.doca 
    AND p.horario = h.horario 
    AND DATE(p.data) = ?
WHERE
    (d.doca = 1 AND h.horario IN ('00:00:00', '03:00:00', '21:00:00'))
    OR (d.doca = 2 AND h.horario IN ('00:00:00', '03:00:00', '21:00:00'))
    OR (d.doca = 3 AND h.horario IN ('01:00:00', '21:00:00'))
GROUP BY 
    d.doca, h.horario
ORDER BY 
    d.doca, h.horario;`;

        const results = await consulta(sql, [data]);

        const disponibilidade = {
            doca1: [],
            doca2: [],
            doca3: []
        };

        results.forEach(row => {
            const horarioDisponivel = {
                horario: row.horario,
                disponivel: row.agendamentos === 0
            };

            if (row.doca === 1) {
                disponibilidade.doca1.push(horarioDisponivel);
            } else if (row.doca === 2) {
                disponibilidade.doca2.push(horarioDisponivel);
            } else if (row.doca === 3) {
                disponibilidade.doca3.push(horarioDisponivel);
            }
        });

        return disponibilidade;
    }


    async getDisponibilidadePorData(req, res) {
        try {
            // Extraindo a data dos parâmetros da URL
            const { data } = req.params;
    
            // Reutilizando a função checkDisponibilidade para obter a disponibilidade
            const disponibilidade = await this.checkDisponibilidade(data);
    
            res.json(disponibilidade);
        } catch (error) {
            console.error('Erro ao buscar disponibilidade por data:', error);
            res.status(500).send('Erro ao buscar disponibilidade por data.');
        }
    }

// Função para obter a data do agendamento e verificar a disponibilidade
async getDisponibilidadePorAgendamento(id) {
    try {
        const sqlData = `
            SELECT DATE(data) as data 
            FROM preagendamentos 
            WHERE id = ?;
        `;
        console.log('Consulta SQL:', sqlData); // Adicionar um log para verificar a consulta SQL
        const resultData = await consulta(sqlData, [id]);

        if (resultData.length === 0) {
            throw new Error('Agendamento não encontrado.');
        }

        const data = resultData[0].data;
        const disponibilidade = await this.checkDisponibilidade(data);
        return disponibilidade;
    } catch (error) {
        console.error('Erro ao buscar disponibilidade por agendamento:', error);
        throw error;
    }
}
async createDescarregamentoInicio(preagendamentoId, inicioDescarregamento) {
    try {
        const sql = `
            INSERT INTO tempos_descarregamento (preagendamento_id, inicio_descarregamento)
            VALUES (?, ?)
        `;
        const valores = [preagendamentoId, inicioDescarregamento];
        const result = await consulta(sql, valores);
        return result.insertId;
    } catch (error) {
        throw new Error('Erro ao registrar o início do descarregamento: ' + error.message);
    }
}

async updateDescarregamentoFim(preagendamentoId, fimDescarregamento) {
    try {
        const sql = `
            UPDATE tempos_descarregamento 
            SET fim_descarregamento = ? 
            WHERE preagendamento_id = ?
        `;
        const valores = [fimDescarregamento, preagendamentoId];
        const result = await consulta(sql, valores);
        return result;
    } catch (error) {
        throw new Error('Erro ao registrar o fim do descarregamento: ' + error.message);
    }
}
}

export default new PreagendamentoRepository();