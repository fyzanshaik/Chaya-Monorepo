import type { FastifyInstance } from "fastify";
import { prisma } from "@chaya/shared";
import { authenticate } from "../middlewares/auth";
import {
  createProcessingSchema,
  updateProcessingSchema,
  createDryingSchema,
} from "@chaya/shared";
import { generateBatchCode } from "../helper";

async function processingRoutes(fastify: FastifyInstance) {
  // Create a new processing record
  fastify.post("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const {
        procurementId,
        lotNo,
        crop,
        procuredForm,
        quantity,
        speciality,
        processMethod,
        dateOfProcessing,
        dateOfCompletion,
        quantityAfterProcess,
        doneBy,
      } = createProcessingSchema.parse(request.body);

      // Generate a unique batch number using the existing generateBatchCode function
      const batchNo = generateBatchCode(crop, dateOfProcessing, lotNo);

      // Create the processing record
      const processing = await prisma.processing.create({
        data: {
          procurementId,
          lotNo,
          batchNo,
          crop,
          procuredForm,
          quantity,
          speciality,
          processMethod,
          dateOfProcessing,
          dateOfCompletion,
          quantityAfterProcess,
          doneBy,
        },
      });

      return { processing };
    } catch (error) {
      console.error("Create processing error:", error);
      return reply.status(400).send({ error: "Invalid request data" });
    }
  });

  // Add drying details for a processing record
  fastify.post(
    "/drying",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const {
          processingId,
          day,
          temperature,
          humidity,
          pH,
          moistureQuantity,
        } = createDryingSchema.parse(request.body);

        const drying = await prisma.drying.create({
          data: {
            processingId,
            day,
            temperature,
            humidity,
            pH,
            moistureQuantity,
          },
        });

        return { drying };
      } catch (error) {
        console.error("Create drying error:", error);
        return reply.status(400).send({ error: "Invalid request data" });
      }
    }
  );

  // Update a processing record
  fastify.put("/:id", { preHandler: authenticate }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const updateData = updateProcessingSchema.parse(request.body);

      const processing = await prisma.processing.update({
        where: { id: parseInt(id) },
        data: updateData,
      });

      return { processing };
    } catch (error) {
      console.error("Update processing error:", error);
      return reply.status(400).send({ error: "Invalid request data" });
    }
  });

  // Mark processing as finished
  fastify.patch(
    "/:id/finish",
    { preHandler: authenticate },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };

        const processing = await prisma.processing.update({
          where: { id: parseInt(id) },
          data: { status: "FINISHED" },
        });

        return { processing };
      } catch (error) {
        console.error("Finish processing error:", error);
        return reply.status(400).send({ error: "Invalid request data" });
      }
    }
  );

  // Get all processing records
  fastify.get("/", { preHandler: authenticate }, async (request, reply) => {
    try {
      const processingRecords = await prisma.processing.findMany({
        include: {
          drying: true,
          procurement: {
            select: {
              crop: true,
              batchCode: true,
              quantity: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { processingRecords };
    } catch (error) {
      console.error("Get processing records error:", error);
      return reply.status(500).send({ error: "Server error" });
    }
  });
}

export default processingRoutes;
