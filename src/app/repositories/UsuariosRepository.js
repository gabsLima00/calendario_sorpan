import { consulta } from "../database/conexao.js";

class UsuariosRepository {
    async findAll() {
        const sql = `
        SELECT 
    p.id, 
    COALESCE(m.NOME, 'Não Atribuído') AS motorista, 
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
    motoristas m ON m.idPreAgendamento = p.id
WHERE 
    p.confirmado = 0
ORDER BY 
    p.data ASC
LIMIT 1000;

`;
        try {
            const usuarios = await consulta(sql);
            return usuarios;
        } catch (error) {
            throw new Error('Erro ao buscar dados de usuários: ' + error.message);
        }
    }
    async findAllNotasFiscaisByAgendamentoId(idAgendamento) {
        const sql = `
        SELECT 
        p.id, 
        m.nome AS motorista, 
        p.placaVeiculo, 
        nf.numero AS numeroNotaFiscal,
        p.tipoDescarregamento AS descarregamento, 
        p.data, 
        p.doca, 
        p.horario,
        p.tipoCarga
    FROM 
        preagendamentos p
    JOIN 
        usuarios u ON u.id = p.idUsuario
    JOIN 
        motoristas m ON m.id = p.id 
    LEFT JOIN 
        notafiscals nf ON nf.idPreAgendamento = p.id
       
    WHERE 
        p.id = ?;`;

        try {
            const notasFiscais = await consulta(sql, idAgendamento);
            return notasFiscais;
        } catch (error) {
            throw new Error('Erro ao buscar notas fiscais relacionadas ao agendamento: ' + error.message);
        }
    }

    async findById(id) {
        const sql = 'SELECT * FROM usuarios WHERE id = ?';
        try {
            const result = await consulta(sql, [id]);
            return result[0];
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            throw new Error('Erro interno ao buscar usuário por ID.');
        }
    }


    async create(usuario) {
        const sql = "INSERT INTO usuarios SET ?";
        return consulta(sql, usuario, 'Não foi possível cadastrar usuário.');
    }

    async update(preagendamento, id) {
        try {
            const sqlUpdate = `
                UPDATE preagendamentos
                SET data = ?, horario = ?, doca = ?
                WHERE id = ?
            `;
            const valuesUpdate = [preagendamento.data, preagendamento.horario, preagendamento.doca, id];
    
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
        const sql = "DELETE FROM usuarios WHERE id=?";
        return consulta(sql, id, 'Não foi possível excluir usuário.');
    }


    async getUsuariosConfirmadosPorDoca(doca) {
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
        fornecedors f ON f.idPreAgendamento = p.id
    LEFT JOIN 
        motoristas m ON m.idPreAgendamento = p.id 
    WHERE 
        p.confirmado = 1
        AND p.doca = ?
    ORDER BY 
        p.data ASC
    LIMIT 1000;`;
        try {
            const result = await consulta(sql, [doca]);
            return result;
        } catch (error) {
            console.error('Erro ao buscar agendamentos confirmados:', error);
            throw new Error('Erro interno ao buscar agendamentos confirmados');
        }
    }
    async findDetalhesAgendamentoById(idAgendamento) {
        const sql = `
        SELECT 
        p.id,
        u.nome_fantasia AS nomeEmpresa,
        f.cnpj,
        (SELECT m.nome FROM motoristas m WHERE m.idPreAgendamento = p.id LIMIT 1) AS nomeMotorista,
        (SELECT m.cnh FROM motoristas m WHERE m.idPreAgendamento = p.id LIMIT 1) AS cnh,
        (SELECT m.telefone FROM motoristas m WHERE m.idPreAgendamento = p.id LIMIT 1) AS telefone,
        p.placaVeiculo,
        GROUP_CONCAT(nf.numero) AS numeroNotaFiscal,
        p.tipoCarga,
        p.tipoDescarregamento,
        (SELECT fc.comprador FROM fornecedors fc WHERE fc.idPreAgendamento = p.id LIMIT 1) AS nomeComprador
    FROM 
        preagendamentos p
    JOIN 
        usuarios u ON u.id = p.idUsuario
    LEFT JOIN 
        fornecedors f ON f.idPreAgendamento = p.id
    LEFT JOIN 
        notafiscals nf ON nf.idFornecedor = f.id
    LEFT JOIN 
        fornecedors fc ON fc.idPreAgendamento = p.id
    WHERE 
        p.id = ?
    GROUP BY
        p.id, u.nome_fantasia, f.cnpj, p.placaVeiculo, p.tipoCarga, p.tipoDescarregamento
    LIMIT 0, 1000;`;

        try {
            const detalhesAgendamento = await consulta(sql, idAgendamento);
            return detalhesAgendamento;
        } catch (error) {
            throw new Error('Erro ao buscar os detalhes do agendamento: ' + error.message);
        }
    }

}
export default new UsuariosRepository()