-- CreateTable
CREATE TABLE "suscripciones" (
    "id" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "nombre" TEXT,
    "tramos" TEXT[],
    "nivel" TEXT NOT NULL DEFAULT 'problemas',
    "desde_hora" INTEGER NOT NULL DEFAULT 0,
    "hasta_hora" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "token" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_enviadas" (
    "id" SERIAL NOT NULL,
    "suscripcion_id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "tramo_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "motivos" TEXT NOT NULL,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_enviadas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_telefono_key" ON "suscripciones"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "suscripciones_token_key" ON "suscripciones"("token");

-- CreateIndex
CREATE INDEX "alertas_enviadas_enviado_en_idx" ON "alertas_enviadas"("enviado_en");

-- AddForeignKey
ALTER TABLE "alertas_enviadas" ADD CONSTRAINT "alertas_enviadas_suscripcion_id_fkey" FOREIGN KEY ("suscripcion_id") REFERENCES "suscripciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
