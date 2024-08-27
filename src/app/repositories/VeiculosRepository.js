import { consulta } from "../database/conexao.js";

class VeiculosRepository {
    async findAll() {
        const sql = "SELECT * FROM veiculos";
        return consulta(sql, 'Não foi possível localizar dados de veículos.');
    }

    async findById(id) {
        const sql = "SELECT * FROM veiculos WHERE id=?";
        return consulta(sql, id, 'Não foi possível localizar dados do veículo.');
    }

    async create(veiculo) {
        const sql = "INSERT INTO veiculos SET ?";
        return consulta(sql, veiculo, 'Não foi possível cadastrar veículo.');
    }

    async update(veiculo, id) {
        const sql = "UPDATE veiculos SET ? WHERE id=?";
        return consulta(sql, [veiculo, id], 'Não foi possível atualizar veículo.');
    }

    async delete(id) {
        const sql = "DELETE FROM veiculos WHERE id=?";
        return consulta(sql, id, 'Não foi possível excluir veículo.');
    }
}

export default new VeiculosRepository();