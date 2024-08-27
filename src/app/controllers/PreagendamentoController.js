import ejs from 'ejs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import LogRepository from '../repositories/LogRepository.js';
import UsuariosRepository from '../repositories/UsuariosRepository.js';
import PreagendamentoRepository from '../repositories/PreagendamentoRepository.js';
import DisponibilidadeRepository from '../repositories/DisponibilidadeRepository.js';
import { startTransaction, commitTransaction, rollbackTransaction } from '../database/conexao.js';
import nodemailer from 'nodemailer';


// Configuração do nodemailer para enviar emails
const transporter = nodemailer.createTransport({
    host: 'mail.sorpan.com.br',
    port: 587,
    secure: false,
    auth: {
        user: 'dukem@sorpan.com.br',
        pass: 'dkS0rp4nl123@@'
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
});

async function sendConfirmationEmail(email, agendamento) {
    const data = agendamento.data instanceof Date ? agendamento.data : new Date(agendamento.data);
    const dataFormatada = isNaN(data.getTime()) ? 'Data inválida' : data.toISOString().split('T')[0];

    // Caminho para o arquivo do template EJS
    const templatePath = './src/app/views/confirmacao_template.ejs'

    // Renderiza o template EJS
    ejs.renderFile(templatePath, { 
        id: agendamento.preagendamento,
        data: dataFormatada,
        horario: agendamento.horario,
        doca: agendamento.doca,
        notaFiscal: agendamento.notaFiscal,
        cte: agendamento.cte,
        motorista: agendamento.motorista
    }, async (err, html) => {
        if (err) {
            console.error('Erro ao renderizar o template:', err);
            return;
        }

        const mailOptions = {
            from: 'dukem@sorpan.com.br',
            to: email,
            subject: 'Confirmação de Agendamento',
            html: html
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log('Email de confirmação enviado para:', email);
            console.log('Detalhes do Agendamento:', agendamento);
        } catch (error) {
            console.error('Erro ao enviar email de confirmação:', error);
        }
    });
}


class PreagendamentoController {
    
    async index(req, res) {
        try {
            // Busca todos os pré-agendamentos confirmados do banco de dados
            const preagendamentosConfirmados = await PreagendamentoRepository.NaoConfirmados();
            const usuariosComClasses = usuariosNaoConfirmados.map(usuario => {
                const classeCor = calcularClasseEstado(usuario.data);
                return { ...usuario, classeCor };
            });

            // Caminho para o arquivo EJS de visualização para pré-agendamentos confirmados
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = dirname(__filename);
            const filePath = join(__dirname, '../views/painelConfirmados.ejs');

            // Renderiza o arquivo EJS com os dados dos pré-agendamentos confirmados
            ejs.renderFile(filePath, { preagendamentos: preagendamentosConfirmados }, (err, html) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Erro ao renderizar a página de pré-agendamentos confirmados');
                } else {
                    res.send(html);
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Erro ao buscar dados de pré-agendamentos confirmados');
        }
    }
    async show(req, res) {
        const id = req.params.id;
        try {
            const preagendamento = await PreagendamentoRepository.findById(id);
            if (!preagendamento) {
                return res.status(404).json({ error: 'Preagendamento não encontrado.' });
            }
            res.json(preagendamento);
        } catch (error) {
            console.error('Erro ao buscar dados do preagendamento:', error);
            res.status(500).send('Erro ao buscar dados do preagendamento');
        }

    }

    async store(req, res) {
        const preagendamento = req.body;
        const novoPreagendamento = await PreagendamentoRepository.create(preagendamento);
        res.json(novoPreagendamento);
    }
    async update(req, res) {
        const id = req.params.id;
        const { data, horario, doca } = req.body;
        const usuarioId = req.session.usuario.id;
    
        try {
            await startTransaction();
    
            const preagendamento = await PreagendamentoRepository.findById(id);
            if (!preagendamento) {
                await rollbackTransaction();
                return res.status(404).json({ error: 'Agendamento não encontrado.' });
            }
    
            const dataOriginal = preagendamento.data;
    
            preagendamento.data = data;
            preagendamento.horario = horario;
            preagendamento.doca = doca;
    
            if (dataOriginal !== data) {
                try {
                    await DisponibilidadeRepository.updateAvailabilityInTransaction(dataOriginal, data, id);
                } catch (error) {
                    await rollbackTransaction();
                    console.error('Erro ao atualizar a disponibilidade:', error);
                    return res.status(500).json({ error: 'Erro ao atualizar a disponibilidade.' });
                }
            }
    
            const agendamentoAtualizado = await PreagendamentoRepository.update(preagendamento, id);

            await LogRepository.create({
                usuarioId,
                acao: 'editar',
                preagendamentoId: id // Passa o ID do pré-agendamento aqui
            });
    
            await commitTransaction();
    
            res.json(agendamentoAtualizado);
        } catch (error) {
            await rollbackTransaction();
            console.error('Erro ao atualizar agendamento:', error);
            res.status(500).send('Erro ao atualizar agendamento.');
        }
    }

    async delete(req, res) {
        const id = req.params.id;
        const resultado = await PreagendamentoRepository.delete(id);
        res.json(resultado);
    }
    async findByDate(req, res) {
        const { data, doca } = req.params; // Assumindo que a data e o número da doca estão sendo passados como parâmetros na requisição

        try {
            const agendamentosConfirmados = await PreagendamentoRepository.findByDate(data, doca);

            // Renderize ou envie os agendamentos confirmados como resposta
            res.json(agendamentosConfirmados);
        } catch (error) {
            console.error('Erro ao buscar agendamentos confirmados por data e doca:', error);
            res.status(500).send('Erro interno ao buscar agendamentos confirmados por data e doca');
        }
    }

    async confirmarPreagendamento(req, res) {
        const id = req.params.id;
        const usuarioId = req.session.usuario.id;
    
        try {
            const preagendamento = await PreagendamentoRepository.findDetailedById(id);
            if (!preagendamento) {
                return res.status(404).json({ error: 'Pré-agendamento não encontrado.' });
            }
    
            if (!preagendamento.horario || !preagendamento.doca) {
                return res.status(400).json({ error: 'Horário e Doca devem estar definidos para confirmar o agendamento.' });
            }
    
            preagendamento.confirmado = 1;
            const preagendamentoAtualizado = await PreagendamentoRepository.updateUM(preagendamento, id);
    
            try {
                await sendConfirmationEmail(preagendamento.usuarioEmail, preagendamento);
            } catch (error) {
                return res.status(500).json({ 
                    message: 'Agendamento confirmado, mas houve um erro ao enviar o email de confirmação.', 
                    preagendamento: preagendamentoAtualizado 
                });
            }
    
            await LogRepository.create({
                usuarioId,
                acao: 'confirmar',
                preagendamentoId: id
            });
    
            res.json(preagendamentoAtualizado);
        } catch (error) {
            console.error('Erro ao confirmar pré-agendamento:', error);
            res.status(500).send('Erro interno ao confirmar pré-agendamento.');
        }
    }

    async updateStatus(req, res) {
        const id = req.params.id;
        const { status } = req.body;

        try {
            // Atualizar o status do agendamento
            const agendamentoAtualizado = await PreagendamentoRepository.updateStatus(id, status);
            res.json(agendamentoAtualizado);
        } catch (error) {
            console.error('Erro ao atualizar status do agendamento:', error);
            res.status(500).send('Erro interno ao atualizar status do agendamento');
        }
    }

    async recusar(req, res) {
        const { id } = req.params;
        const { status } = req.body; // Assume que o status é enviado no corpo da requisição
        const usuarioId = req.session.usuario.id;
    
        try {
            // Buscar o pré-agendamento pelo ID
            const preagendamento = await PreagendamentoRepository.findById(id);
            if (!preagendamento) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
    
            // Atualizar o status do agendamento
            const result = await PreagendamentoRepository.updateStatus(id, status);
            if (result.affectedRows > 0) {
                // Decrementar a quantidade de reservas na data correspondente se o status for recusado (2)
                if (status === 2) {
                    const dataOriginal = preagendamento.data;
                    await DisponibilidadeRepository.decrementarQuantidadeReservas(dataOriginal);
                }
    
                // Registrar log da ação de recusa
                await LogRepository.create({
                    usuarioId,
                    acao: status === 2 ? 'recusar' : 'remover',
                    preagendamentoId: id
                });
    
                res.json({ message: `Agendamento ${status === 2 ? 'recusado' : 'removido'} com sucesso` });
            } else {
                res.status(404).json({ error: 'Agendamento não encontrado' });
            }
        } catch (error) {
            console.error('Erro ao recusar agendamento:', error);
            res.status(500).json({ error: 'Erro interno ao recusar agendamento' });
        }
    }                                                       

    async getUsuariosConfirmadosPorDocasEData(req, res) {
        const { data } = req.params; // Assumindo que a data está sendo passada como parâmetro na requisição

        try {
            // Busca os usuários confirmados para cada doca para a data selecionada
            const usuariosDoca1 = await PreagendamentoRepository.getUsuariosConfirmadosPorDocaEData(1, data);
            const usuariosDoca2 = await PreagendamentoRepository.getUsuariosConfirmadosPorDocaEData(2, data);
            const usuariosDoca3 = await PreagendamentoRepository.getUsuariosConfirmadosPorDocaEData(3, data);

            // Renderiza a página painelConfirmados.ejs com os dados dos usuários confirmados para cada doca
            res.render('painelConfirmados', {
                usuariosDoca1: usuariosDoca1,
                usuariosDoca2: usuariosDoca2,
                usuariosDoca3: usuariosDoca3
            });
        } catch (error) {
            console.error('Erro ao buscar dados de usuários confirmados por doca:', error);
            res.status(500).send('Erro interno ao buscar dados de usuários confirmados por doca');
        }
    }
    // Adicione este método ao controlador
    async findByDateAndDock(req, res) {
        const { data } = req.params;
        const doca = req.url.split('/')[3]; // Extrai o número da doca da URL

        try {
            const agendamentosConfirmados = await PreagendamentoRepository.findByDateAndDock(data, doca);
            res.json(agendamentosConfirmados);
        } catch (error) {
            console.error('Erro ao buscar agendamentos confirmados por data e doca:', error);
            res.status(500).send('Erro interno ao buscar agendamentos confirmados por data e doca');
        }
    }
    async findByDateAndDoca(req, res) {
        const { data, doca } = req.params;
        try {
            const agendamentosConfirmados = await PreagendamentoRepository.findByDate(data, doca);
            res.json(agendamentosConfirmados);
        } catch (error) {
            console.error('Erro ao buscar agendamentos confirmados por data e doca:', error);
            res.status(500).send('Erro interno ao buscar agendamentos confirmados por data e doca, gabriel ');
        }
    }
    async findByDate(req, res) {
        const { data } = req.params;
        try {
            const agendamentosConfirmados = await PreagendamentoRepository.findByDate(data);
            res.json(agendamentosConfirmados);
        } catch (error) {
            console.error('Erro ao buscar agendamentos confirmados por data:', error);
            res.status(500).send('Erro interno ao buscar agendamentos confirmados por data');
        }
    }
    async gerarRelatorioPDF(req, res) {
        const { data } = req.params;

        try {
            const agendamentosConfirmados = await PreagendamentoRepository.findByDate(data);

            const doc = new PDFDocument();
            let filename = `relatorio_${data}.pdf`;
            filename = encodeURIComponent(filename);

            // Configuração de cabeçalho
            doc.fontSize(24).text(`Relatório de Agendamentos Confirmados - ${new Date(data).toLocaleDateString('pt-BR')}`, { align: 'center', underline: true }).moveDown();

            const docas = [1, 2, 3];
            docas.forEach(doca => {
                const agendamentos = agendamentosConfirmados.filter(a => a.doca == doca);

                if (agendamentos.length > 0) {
                    // Cabeçalho para cada doca
                    doc.addPage();
                    doc.fontSize(13).text(`Doca ${doca}`, { underline: false });

                    agendamentos.forEach(agendamento => {
                        // Estilo para cada item de agendamento
                        doc.moveDown(0.5);

                        // Adiciona destaque para ID, Horário, Data e Doca
                        doc.fillColor('#000').text('ID: ', { continued: true }).fillColor('#666').text(`${agendamento.id}`, { bold: true });
                        doc.fillColor('#000').text('Motorista: ', { continued: true }).fillColor('#666').text(`${agendamento.motorista}`);
                        doc.fillColor('#000').text('Placa do Veículo: ', { continued: true }).fillColor('#666').text(`${agendamento.placaVeiculo || 'N/A'}`);
                        doc.fillColor('#000').text('Empresa: ', { continued: true }).fillColor('#666').text(`${agendamento.empresa || 'N/A'}`);
                        doc.fillColor('#000').text('Descarregamento: ', { continued: true }).fillColor('#666').text(`${agendamento.descarregamento || 'Sem descrição'}`);
                        doc.fillColor('#000').text('Data: ', { continued: true }).fillColor('#666').text(`${new Date(agendamento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`);
                        doc.fillColor('#000').text('Horário: ', { continued: true }).fillColor('#666').text(`${agendamento.horario || 'N/A'}`);
                        doc.fillColor('#000').text('Tipo de Carga: ', { continued: true }).fillColor('#666').text(`${agendamento.tipoCarga || 'Sem descrição'}`);

                        // Adiciona uma linha cinza após cada item
                        doc.strokeColor('lightgrey').moveTo(72, doc.y).lineTo(572, doc.y).stroke();
                    });
                }
            });

            // Finaliza o documento e envia para o navegador
            doc.end();
            doc.pipe(res);

            // Configuração de cabeçalho HTTP para a exibição do PDF na web
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        } catch (error) {
            console.error('Erro ao gerar relatório PDF:', error);
            res.status(500).send('Erro interno ao gerar relatório PDF');
        }
    }
    async verificarDisponibilidade(req, res) {
        const { data } = req.params;
        try {
            const disponibilidade = await PreagendamentoRepository.checkDisponibilidade(data);
            res.json(disponibilidade);
        } catch (error) {
            console.error('Erro ao verificar disponibilidade:', error);
            res.status(500).send('Erro interno ao verificar disponibilidade');
        }
    }
    async getDisponibilidadePorAgendamento(req, res) {
        const { id } = req.params; // Verificar se o ID está sendo recebido corretamente
        console.log('ID do Agendamento:', id); // Adicionar um log para verificar o ID do agendamento
        try {
            const disponibilidade = await PreagendamentoRepository.getDisponibilidadePorAgendamento(id);
            res.json(disponibilidade);
        } catch (error) {
            console.error('Erro ao buscar disponibilidade por agendamento:', error);
            res.status(500).send('Erro interno ao buscar disponibilidade por agendamento');
        }
    }
    static async store(req, res) {
        try {
            const preagendamento = await PreagendamentoRepository.create(req.body);
            io.emit('novo-preagendamento', preagendamento); // Notifica todos os clientes conectados
            res.status(201).json(preagendamento);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao criar pré-agendamento' });
        }
    }
    async registrarInicio(req, res) {
        try {
            const { id } = req.params;
            const inicioDescarregamento = new Date();
            console.log('ID do preagendamento:', id);
            console.log('Hora de início do descarregamento:', inicioDescarregamento);
            
            const tempoId = await PreagendamentoRepository.createDescarregamentoInicio(id, inicioDescarregamento);
            console.log('ID do tempo de descarregamento criado:', tempoId);
    
            res.status(200).json({ message: 'Início do descarregamento registrado com sucesso!', tempoId });
        } catch (error) {
            console.error('Erro ao registrar o início do descarregamento:', error);
            res.status(500).json({ message: 'Erro ao registrar o início do descarregamento.', error });
        }
    }

     async registrarFim(req, res) {
        try {
            const { id } = req.params;
            const fimDescarregamento = new Date();
            await PreagendamentoRepository.updateDescarregamentoFim(id, fimDescarregamento);
            res.status(200).json({ message: 'Fim do descarregamento registrado com sucesso!' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao registrar o fim do descarregamento.', error });
        }
    }

}


export default new PreagendamentoController();