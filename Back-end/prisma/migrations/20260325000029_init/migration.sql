-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "nivel_acesso" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "responsavel" (
    "id_responsavel" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,

    CONSTRAINT "responsavel_pkey" PRIMARY KEY ("id_responsavel")
);

-- CreateTable
CREATE TABLE "crianca" (
    "id_matricula" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "data_nascimento" TIMESTAMP(3) NOT NULL,
    "cpf" TEXT NOT NULL,
    "foto_path" TEXT,
    "certidao_nasc" TEXT,
    "cartao_vacina" TEXT,
    "data_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_responsavel" INTEGER NOT NULL,

    CONSTRAINT "crianca_pkey" PRIMARY KEY ("id_matricula")
);

-- CreateTable
CREATE TABLE "frequencia" (
    "id_frequencia" SERIAL NOT NULL,
    "id_matricula" INTEGER NOT NULL,
    "data_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,

    CONSTRAINT "frequencia_pkey" PRIMARY KEY ("id_frequencia")
);

-- CreateTable
CREATE TABLE "atividade" (
    "id_atividade" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "data_realizacao" TIMESTAMP(3) NOT NULL,
    "id_usuario_resp" INTEGER NOT NULL,

    CONSTRAINT "atividade_pkey" PRIMARY KEY ("id_atividade")
);

-- CreateTable
CREATE TABLE "evento" (
    "id_evento" SERIAL NOT NULL,
    "nome_evento" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "data_realizacao" TIMESTAMP(3) NOT NULL,
    "id_usuario_resp" INTEGER NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id_evento")
);

-- CreateTable
CREATE TABLE "doacao" (
    "id_doacao" SERIAL NOT NULL,
    "doador" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data_doacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doacao_pkey" PRIMARY KEY ("id_doacao")
);

-- CreateTable
CREATE TABLE "declaracao" (
    "id_declaracao" SERIAL NOT NULL,
    "id_matricula" INTEGER NOT NULL,
    "id_usuario_autorizador" INTEGER NOT NULL,
    "nome_parente" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "data_emissao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "declaracao_pkey" PRIMARY KEY ("id_declaracao")
);

-- CreateTable
CREATE TABLE "relatorio_auditoria" (
    "id_relatorio" SERIAL NOT NULL,
    "tipo_periodo" TEXT NOT NULL,
    "data_geracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "path_arquivo" TEXT NOT NULL,

    CONSTRAINT "relatorio_auditoria_pkey" PRIMARY KEY ("id_relatorio")
);

-- CreateTable
CREATE TABLE "log_sistema" (
    "id_log" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "acao" TEXT NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_sistema_pkey" PRIMARY KEY ("id_log")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "responsavel_cpf_key" ON "responsavel"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "crianca_cpf_key" ON "crianca"("cpf");

-- AddForeignKey
ALTER TABLE "crianca" ADD CONSTRAINT "crianca_id_responsavel_fkey" FOREIGN KEY ("id_responsavel") REFERENCES "responsavel"("id_responsavel") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencia" ADD CONSTRAINT "frequencia_id_matricula_fkey" FOREIGN KEY ("id_matricula") REFERENCES "crianca"("id_matricula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_id_usuario_resp_fkey" FOREIGN KEY ("id_usuario_resp") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_id_usuario_resp_fkey" FOREIGN KEY ("id_usuario_resp") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaracao" ADD CONSTRAINT "declaracao_id_matricula_fkey" FOREIGN KEY ("id_matricula") REFERENCES "crianca"("id_matricula") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "declaracao" ADD CONSTRAINT "declaracao_id_usuario_autorizador_fkey" FOREIGN KEY ("id_usuario_autorizador") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_sistema" ADD CONSTRAINT "log_sistema_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
