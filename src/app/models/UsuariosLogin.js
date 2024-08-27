const Sequelize = require("sequelize");
const connection = require("../dataBase/dbMysql");

const Usuario = connection.define('usuario', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cpf: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Garante que o CPF seja único
    },
    data: {
        type: Sequelize.STRING,
        allowNull: false
    },
    cnh: {
        type: Sequelize.STRING,
        allowNull: false
    },
    telefone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    permissao: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false // Valor padrão é false
    },
    nivelConta: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    slug: {
        type: Sequelize.STRING,
        allowNull: true
    },
    foto: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

module.exports = Usuario;