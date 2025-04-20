"use server";

import axios from "axios";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:5000";

export async function getProcessingRecords({
  page = 1,
  query = "",
}: {
  page?: number;
  query?: string;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`${API_URL}/api/processing`, {
      headers: {
        Cookie: `token=${token}`,
      },
      params: {
        page,
        limit: 10,
        query,
      },
    });

    return {
      processingRecords: response.data.processingRecords,
      totalCount: response.data.totalCount,
      totalPages: response.data.totalPages,
    };
  } catch (error) {
    console.error("Error fetching processing records:", error);
    throw error;
  }
}

export async function addProcessing(data: any) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(`${API_URL}/api/processing`, data, {
      headers: {
        Cookie: `token=${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error adding processing:", error);
    throw error;
  }
}

export async function addDryingData(processingId: number, data: any) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      `${API_URL}/api/processing/${processingId}/drying`,
      data,
      {
        headers: {
          Cookie: `token=${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error adding drying data:", error);
    throw error;
  }
}

export async function completeProcessing(
  processingId: number,
  action: "sell" | "continue",
  quantityAfterProcess: number
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.post(
      `${API_URL}/api/processing/${processingId}/complete`,
      { action, quantityAfterProcess },
      {
        headers: {
          Cookie: `token=${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error completing processing:", error);
    throw error;
  }
}
