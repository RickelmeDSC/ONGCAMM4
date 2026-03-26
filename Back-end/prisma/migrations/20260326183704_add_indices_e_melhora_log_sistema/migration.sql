-- AlterTable
ALTER TABLE "log_sistema" ADD COLUMN     "entidade" TEXT,
ADD COLUMN     "entidade_id" INTEGER,
ADD COLUMN     "ip" TEXT;

-- CreateIndex
CREATE INDEX "crianca_nome_idx" ON "crianca"("nome");

-- CreateIndex
CREATE INDEX "crianca_id_responsavel_idx" ON "crianca"("id_responsavel");

-- CreateIndex
CREATE INDEX "doacao_data_doacao_idx" ON "doacao"("data_doacao");

-- CreateIndex
CREATE INDEX "frequencia_id_matricula_idx" ON "frequencia"("id_matricula");

-- CreateIndex
CREATE INDEX "frequencia_data_registro_idx" ON "frequencia"("data_registro");

-- CreateIndex
CREATE INDEX "log_sistema_id_usuario_idx" ON "log_sistema"("id_usuario");

-- CreateIndex
CREATE INDEX "log_sistema_data_hora_idx" ON "log_sistema"("data_hora");

-- CreateIndex
CREATE INDEX "log_sistema_entidade_idx" ON "log_sistema"("entidade");

-- CreateIndex
CREATE INDEX "refresh_token_id_usuario_idx" ON "refresh_token"("id_usuario");

-- CreateIndex
CREATE INDEX "refresh_token_expires_at_idx" ON "refresh_token"("expires_at");

-- CreateIndex
CREATE INDEX "responsavel_nome_idx" ON "responsavel"("nome");

-- CreateIndex
CREATE INDEX "usuario_nome_idx" ON "usuario"("nome");
