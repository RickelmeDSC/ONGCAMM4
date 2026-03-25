const fs = require('fs');
const path = 'C:/Users/rickm/ONGCAMM4/Back-end/CLAUDE.md';

const lines = [];
lines.push('# CLAUDE.md \u2014 Documenta\u00e7\u00e3o Global do Projeto Backend ONG CAMM4');
lines.push('');
lines.push('> Este arquivo \u00e9 a fonte de verdade do projeto. Toda implementa\u00e7\u00e3o deve seguir rigorosamente o que est\u00e1 definido aqui. Nenhuma decis\u00e3o arquitetural deve ser tomada sem consultar este documento.');
lines.push('');
lines.push('---');
lines.push('');
lines.push('## 1. VIS\u00c3O GERAL DO SISTEMA');
lines.push('');
lines.push('O sistema ONG CAMM4 \u00e9 uma plataforma web destinada a digitalizar e profissionalizar a gest\u00e3o interna de uma organiza\u00e7\u00e3o n\u00e3o governamental. Atualmente, todos os processos s\u00e3o conduzidos manualmente em papel, o que gera inefici\u00eancia operacional, risco de perda de dados, dificuldade de auditoria e aus\u00eancia de controle de acesso.');
lines.push('');
lines.push('A solu\u00e7\u00e3o proposta \u00e9 um sistema web completo com backend em NestJS, banco de dados PostgreSQL gerenciado via Prisma ORM, autentica\u00e7\u00e3o baseada em JWT com hash de senha via bcrypt, gera\u00e7\u00e3o de relat\u00f3rios em PDF e controle granular de permiss\u00f5es por n\u00edvel de acesso.');

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('done');
