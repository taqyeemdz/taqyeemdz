"use server"

import { serverDb } from "@/lib/server-db"
import type { QRCode } from "@/lib/types"
import { generateId, generateQRCodeString } from "@/lib/utils"

// CREATE QR CODE
export async function createQRCode(
  qrCodeData: Omit<QRCode, "id" | "code" | "scansCount" | "createdat">
) {
  try {
    const qrCode: QRCode = {
      ...qrCodeData,
      id: generateId(),
      code: generateQRCodeString(),
      scansCount: 0,
      createdat: new Date().toISOString(),
    }

    return serverDb.createQRCode(qrCode)
  } catch (error) {
    throw new Error("Failed to create QR code")
  }
}

// UPDATE QR CODE
export async function updateQRCode(id: string, updates: Partial<QRCode>) {
  try {
    return serverDb.updateQRCode(id, updates)
  } catch (error) {
    throw new Error("Failed to update QR code")
  }
}

// DELETE QR CODE
export async function deleteQRCode(id: string) {
  try {
    serverDb.deleteQRCode(id)
    return { success: true }
  } catch (error) {
    throw new Error("Failed to delete QR code")
  }
}

// RECORD QR SCAN
export async function recordQRCodeScan(code: string) {
  try {
    const qr = serverDb.getQRCodeByCode(code)
    if (!qr) throw new Error("QR code not found")

    return serverDb.updateQRCode(qr.id, {
      scansCount: qr.scansCount + 1,
    })
  } catch (error) {
    throw new Error("Failed to record scan")
  }
}

// GET QR BY BUSINESS
export async function getQRCodesByBusiness(business_id: string) {
  try {
    return serverDb.getQRCodesByBusiness(business_id)
  } catch (error) {
    throw new Error("Failed to get QR codes")
  }
}
