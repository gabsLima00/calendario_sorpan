import mysql from 'mysql'


const conexao = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'agenda',
})

conexao.connect();

const startTransaction = async () => {
    return new Promise((resolve, reject) => {
        conexao.beginTransaction((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const commitTransaction = async () => {
    return new Promise((resolve, reject) => {
        conexao.commit((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const rollbackTransaction = async () => {
    return new Promise((resolve, reject) => {
        conexao.rollback((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

const consulta = (sql, valores = []) => {
    return new Promise((resolve, reject) => {
        conexao.query(sql, valores, (error, resultado) => {
            if (error) {
                console.error(`Erro na consulta: ${error.message}`, error); // Log detalhado do erro
                reject(error);
            } else {
                resolve(resultado); // Resolva com o resultado da consulta
            }
        });
    });
};


export { startTransaction, commitTransaction, rollbackTransaction, consulta };
export default conexao;
