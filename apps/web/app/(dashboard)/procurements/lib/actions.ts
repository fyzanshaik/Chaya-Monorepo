"use server";

import axios from "axios";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:5000";

interface GetProcurementsParams {
  page?: number;
  query?: string;
}

export async function getProcurements({
  page = 1,
  query = "",
}: GetProcurementsParams) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`${API_URL}/api/procurements`, {
      headers: {
        Cookie: `token=${token}`,
      },
      params: {
        page,
        limit: 10,
        query,
      },
    });

    return response.data.procurements;
  } catch (error) {
    console.error("Error fetching procurements:", error);
    throw error;
  }
}

export async function getProcurementPages(query = "") {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get(`${API_URL}/api/procurements/count`, {
      headers: {
        Cookie: `token=${token}`,
      },
      params: {
        query,
      },
    });

    const totalCount = response.data.count;
    return Math.ceil(totalCount / 10); // Assuming 10 items per page
  } catch (error) {
    console.error("Error fetching procurement count:", error);
    return 1; // Default to 1 page on error
  }
}

export async function bulkDeleteProcurements(ids: number[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      throw new Error("Authentication token not found");
    }

    await axios.delete(`${API_URL}/api/procurements/bulk`, {
      headers: {
        Cookie: `token=${token}`,
      },
      data: { ids },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting procurements:", error);
    return { success: false };
  }
}
