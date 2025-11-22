import { serverDb } from "@/lib/server-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const business_id = searchParams.get("business_id")
    const code = searchParams.get("code")

    if (code) {
      const qrcode = serverDb.getQRCodeByCode(code)
      if (!qrcode) {
        return Response.json({ error: "QR code not found" }, { status: 404 })
      }
      return Response.json(qrcode)
    }

    if (!business_id) {
      return Response.json({ error: "business_id or code required" }, { status: 400 })
    }

    const qrcodes = serverDb.getQRCodesByBusiness(business_id)
    return Response.json(qrcodes)
  } catch (error) {
    return Response.json({ error: "Failed to fetch QR codes" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    const qrcode = {
      ...data,
      createdat: new Date().toISOString(),
    }

    const created = serverDb.createQRCode(qrcode)
    return Response.json(created, { status: 201 })
  } catch (error) {
    return Response.json({ error: "Failed to create QR code" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id } = data

    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 })
    }

    const updated = serverDb.updateQRCode(id, data)
    if (!updated) {
      return Response.json({ error: "QR code not found" }, { status: 404 })
    }

    return Response.json(updated)
  } catch (error) {
    return Response.json({ error: "Failed to update QR code" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ error: "id required" }, { status: 400 })
    }

    serverDb.deleteQRCode(id)
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to delete QR code" }, { status: 500 })
  }
}
