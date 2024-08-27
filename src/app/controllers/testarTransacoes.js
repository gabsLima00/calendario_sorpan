import { startTransaction, commitTransaction, rollbackTransaction, consulta } from '../database/conexao.js';

async function testarTransacoes() {
    try {
        // Iniciar transação
        console.log('Iniciando transação...');
        await startTransaction();

        // Simular uma operação no banco de dados (por exemplo, uma consulta)
        const resultadoConsulta = await consulta('SELECT * FROM preagendamentos');

        // Fazer algo com o resultado da consulta...

        // Commit da transação
        console.log('Commit da transação...');
        await commitTransaction();

        console.log('Transação concluída com sucesso!');
    } catch (error) {
        // Em caso de erro, fazer rollback da transação
        console.error('Erro durante a transação:', error);
        console.log('Fazendo rollback da transação...');
        await rollbackTransaction();
    }
}

// Chamar a função de teste
testarTransacoes();
