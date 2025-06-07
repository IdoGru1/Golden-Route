-- CreateTable
CREATE TABLE "DroneCheck" (
    "id" SERIAL NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "threat" BOOLEAN NOT NULL,
    "flightCallsign" TEXT,
    "distance" DOUBLE PRECISION,
    "closureTime" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DroneCheck_pkey" PRIMARY KEY ("id")
);
