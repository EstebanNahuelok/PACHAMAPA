-- CreateTable
CREATE TABLE "reportes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tramo_id" TEXT NOT NULL,
    "comentario" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'web',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" SERIAL NOT NULL,
    "visitante" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lista_espera" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "rubro" TEXT NOT NULL,
    "mensaje" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lista_espera_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reportes_expira_en_idx" ON "reportes"("expira_en");

-- CreateIndex
CREATE INDEX "visitas_visitante_idx" ON "visitas"("visitante");
